const { resolve } = require('path')
const types = require('@babel/types')
const { NodePath } = require('@babel/traverse')

// 一些不切换的方法名
const NO_REPLACE = new Set(['render'])

function hexHash(str) {
  let hash = 5381,
    i = str.length

  while (i) {
    hash = (hash * 33) ^ str.charCodeAt(--i)
  }
  return (hash >>> 0).toString(16)
}

function getIncrementId(prefix = '_') {
  let i = 0
  return function () {
    return prefix + i++
  }
}

/**
 * 返回加$前缀的名字
 */
const $prefix = name => `$${name}`

/**
 * 从字符串或标识符中获取名字
 */
function getNameByIdtOrSL(node) {
  if (types.isStringLiteral(node)) {
    return node.value
  }
  if (types.isIdentifier(node)) {
    return node.name
  }
  return '_'
}

function getFunctionSelfName(path) {
  let node = path.node
  let id = node.id
  if (id) {
    return getNameByIdtOrSL(id)
  }
  return null
}

/**
 * 判断该函数是否不是ClassMethod和ObjectMethod
 * @param path
 * @return {boolean}
 */
function isSimpleFunction(path) {
  return !types.isClassMethod(path) && !types.isObjectMethod(path)
}

/**
 * 判断是不是自执行函数，自执行的不做修改
 */
function isSelfCallNoneFunction(path) {
  let parent = path.parent
  return types.isCallExpression(parent) && parent.callee === path.node
}

function isLikeDefinePropertyCallParam(func) {
  if (types.isCallExpression(func.parent)) {
    const container = func.container
    return (
      !!container &&
      func.key === 2 &&
      container.length === 3 &&
      types.isStringLiteral(container[1])
    )
  }
}

/**
 * 判断是不是setName的表达式
 * @param {string} callName
 * @param node 节点
 * @return {boolean}
 */
function isSetNameCallExpression(callName, node) {
  if (!!node && types.isCallExpression(node)) {
    return node.callee.name === callName
  }
  return false
}

/**
 * 使用执行语句替换函数声明和函数表达式
 *
 * @param {string} callName setName方法的函数名
 * @param {NodePath} funcPath 当前函数
 * @param nameGenerator 用于生成函数名
 */
function replaceWithCallStatement(callName, funcPath, nameGenerator) {
  if (!funcPath) return
  if (isSetNameCallExpression(callName, funcPath.parent)) return
  if (!isSimpleFunction(funcPath)) return
  if (isSelfCallNoneFunction(funcPath)) return

  let functionName = getFunctionSelfName(funcPath)

  if (NO_REPLACE.has(functionName)) {
    return funcPath
  }

  if (!functionName) {
    functionName = nameGenerator(funcPath)
  }

  let node = funcPath.node
  if (types.isFunctionDeclaration(node)) {
    // 函数声明替换为变量声明形式以保留函数名
    node = types.functionExpression(
      null,
      node.params,
      node.body,
      node.generator,
      node.async
    )
    return funcPath.replaceWith(
      types.variableDeclaration('let', [
        types.variableDeclarator(types.identifier(functionName), node)
      ])
    )
  }

  const callExpr = types.callExpression(types.identifier(callName), [
    types.stringLiteral(functionName),
    node
  ])

  return funcPath.replaceWith(callExpr)
}

/**
 * 根据当前函数路径计算函数的名字
 *
 * @param {NodePath} path
 * @param getIdByFilepath
 * @return {string}
 */
function calcNameByPath(path, getIdByFilepath) {
  let parent = path.parent

  /**
   * 变量声明语句
   * var abc = () => {}
   */
  if (types.isVariableDeclarator(parent)) {
    return parent.id.name
  }
  /**
   * 赋值表达式
   * 1: a.abc = () => {}
   * 2: a['bbb'] = () => {}
   * 3: abx = () => {}
   */
  if (types.isAssignmentExpression(parent) && parent.operator === '=') {
    const left = parent.left
    if (types.isMemberExpression(left)) {
      return $prefix(getNameByIdtOrSL(left.property))
    }
    if (types.isIdentifier(left)) {
      return left.name
    }
  }
  /**
   * 类似 _defineProperty(this,'abc',function(){}) 处理
   */
  if (isLikeDefinePropertyCallParam(path)) {
    return path.container[1].value
  }
  return $prefix(getIdByFilepath())
}

/**
 * 获取当前文件相对地址
 */
function getRelativePath(state) {
  const { cwd, filename } = state
  return filename.replace(cwd, '').replace(/\\+/g, '/')
}

/**
 * 判断当前文件是不是要处理
 * @param {{opts, filename, cwd}} state
 */
function isNeedDeal(state) {
  let { opts, filename, cwd } = state
  let includes = opts.includes || ['src']
  return includes.map(v => resolve(cwd, v)).some(v => filename.startsWith(v))
}

// 获取设置名函数方法名
const diCalleeName = ({ opts }) => opts.callee || '_GIO_DI_NAME_'

function babelPlugin({ template }) {
  let idMap = {}
  function getIdByFilepath(filepath) {
    let id = idMap[filepath] || 0
    return `${filepath}${(idMap[filepath] = ++id)}`
  }

  return {
    name: 'babel-plugin-setname',
    pre() {
      idMap = {}
    },
    visitor: {
      /**
       * @param {NodePath} path
       * @param state
       */
      Program(path, state) {
        let firstBody = path.get('body.0')
        let buildRequire = template(
          `var FUNC_NAME = require('babel-plugin-setname/lib/setname')`
        )
        if (firstBody) {
          firstBody.insertBefore(
            buildRequire({
              FUNC_NAME: diCalleeName(state)
            })
          )
        }
      },
      Class(path, state) {
        if (!isNeedDeal(state)) return
        const callName = diCalleeName(state)
        const jsxFuncName = getIncrementId('anonymousFunc')

        path.traverse({
          ClassProperty(propPath) {
            const key = propPath.get('key').node
            const value = propPath.get('value')
            replaceWithCallStatement(callName, value, () => key.name)
          },
          JSXAttribute(path) {
            path.traverse({
              Function(funPath) {
                replaceWithCallStatement(callName, funPath, jsxFuncName)
              }
            })
          }
        })
      },
      Function(path, state) {
        if (!isNeedDeal(state)) return

        const callName = diCalleeName(state)
        const filepath = hexHash(getRelativePath(state))

        if (
          !replaceWithCallStatement(callName, path, self =>
            calcNameByPath(self, () => getIdByFilepath(filepath))
          )
        ) {
          const jsxFuncName = getIncrementId('anonymousFunc')

          path.traverse({
            JSXAttribute(path) {
              path.traverse({
                Function(funPath) {
                  replaceWithCallStatement(callName, funPath, jsxFuncName)
                }
              })
            }
          })
        }
      }
    }
  }
}

module.exports = babelPlugin
