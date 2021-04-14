const { resolve } = require('path')
const types = require('@babel/types')

function getIncrementId(prefix = '_') {
  let i = 0
  return function () {
    return prefix + i++
  }
}

/**
 * 返回加$前缀的标识符
 */
function $identifier(name) {
  return types.identifier(`$${name}`)
}

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

function hexHash(str) {
  let hash = 5381,
    i = str.length

  while (i) {
    hash = (hash * 33) ^ str.charCodeAt(--i)
  }
  return (hash >>> 0).toString(16)
}

function hasIdentifierName(identifier) {
  return identifier && !!identifier.name
}

/**
 * 判断是不是匿名函数
 * @param path
 * @return {boolean}
 */
function isNoneFunction(path) {
  return (
    !types.isClassMethod(path) &&
    !types.isObjectMethod(path) &&
    types.isFunction(path) &&
    !(hasIdentifierName(path.node.id) || hasIdentifierName(path.node.key))
  )
}

/**
 * 判断是不是自执行函数，自执行的不做修改
 */
function isSelfCallNoneFunction(path) {
  let parent = path.parent
  return types.isCallExpression(parent) && parent.callee === path.node
}

/**
 * 将匿名函数重命名
 * @param path  函数访问路径
 * @param keyGenerator 函数名生成器
 */
function renameNoneFunction(path, keyGenerator) {
  if (!path) return
  if (!isNoneFunction(path)) return
  // 自执行函数不处理
  if (isSelfCallNoneFunction(path)) return

  let body = path.node.body
  if (types.isExpression(body)) {
    body = types.blockStatement([types.returnStatement(body)])
  }

  return path.replaceWith(
    types.functionExpression(
      keyGenerator(path),
      path.node.params,
      body,
      path.node.generator,
      path.node.async
    )
  )
}

function getRelativePath(state) {
  const { cwd, filename } = state
  return filename.replace(cwd, '').replace(/\\+/g, '/')
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

function calcIdentifierByPath(path, getIdByFilepath) {
  let parent = path.parent

  /**
   * 变量声明语句
   * var abc = () => {}
   */
  if (types.isVariableDeclarator(parent)) {
    return types.identifier(parent.id.name)
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
      return $identifier(getNameByIdtOrSL(left.property))
    }
    if (types.isIdentifier(left)) {
      return types.identifier(left.name)
    }
  }
  /**
   * 类似 _defineProperty(this,'abc',function(){}) 处理
   */
  if (isLikeDefinePropertyCallParam(path)) {
    let name = path.container[1].value
    return types.identifier(name)
  }
  return $identifier(getIdByFilepath())
}

function JSXAttributeVisitor(getName) {
  return function (path) {
    path.traverse({
      Function(funPath) {
        renameNoneFunction(funPath, () => types.identifier(getName()))
      }
    })
  }
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

function babelPlugin() {
  let idMap = {}
  function getIdByFilepath(filepath) {
    let id = idMap[filepath] || 0
    return `${filepath}${(idMap[filepath] = ++id)}`
  }
  return {
    name: 'class-prop-function-rename',
    pre() {
      idMap = {}
    },
    visitor: {
      Class(path, state) {
        if (!isNeedDeal(state)) return

        const jsxFuncIdentifier = getIncrementId('anonymousFunc')

        path.traverse({
          ClassProperty(propPath) {
            const key = propPath.get('key').node
            const value = propPath.get('value')
            renameNoneFunction(value, () => key)
          },
          JSXAttribute: JSXAttributeVisitor(jsxFuncIdentifier)
        })
      },
      Function(path, state) {
        if (!isNeedDeal(state)) return

        const filepath = hexHash(getRelativePath(state))

        let renameResult = renameNoneFunction(path, self =>
          calcIdentifierByPath(self, () => getIdByFilepath(filepath))
        )

        if (!renameResult) {
          const jsxFuncIdentifier = getIncrementId('anonymousFunc')

          path.traverse({
            JSXAttribute: JSXAttributeVisitor(jsxFuncIdentifier)
          })
        }
      }
    }
  }
}

module.exports = babelPlugin
