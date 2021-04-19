const types = require('@babel/types')
const { NodePath } = require('@babel/traverse')
const { diCalleeName, isNeedDealFile } = require('./options')
const {
  getIncrementId,
  getComponentName,
  replaceWithCallStatement,
  replaceSpreadWithCallStatement,
  ACTION_REX
} = require('./transform')

/**
 * 判断是不是已经添加过导入语句
 * @param {NodePath[]} body
 * @param {string} varName
 * @return {boolean}
 */
function hasRequire(body, varName) {
  return body.some(path => {
    if (types.isVariableDeclaration(path)) {
      const kind = path.node.kind
      if (kind !== 'var') {
        return false
      }

      const declarations = path.node.declarations
      if (declarations.length !== 1) {
        return false
      }

      const declarator = declarations[0]
      if (!types.isVariableDeclarator(declarator)) {
        return false
      }

      return (
        declarator.id.name === varName &&
        types.isCallExpression(declarator.init) &&
        declarator.init.callee.name === 'require' &&
        declarator.init.arguments[0].value ===
          'babel-plugin-setname/lib/setname'
      )
    }
    return false
  })
}

/**
 * 访问React组件
 * @param {NodePath} path
 * @param state
 */
function visitorComponent(path, state) {
  if (!isNeedDealFile(state)) return
  const calleeName = diCalleeName(state)
  const compName = getComponentName(path)
  const anonymousFuncName = getIncrementId('anonymousFunc')

  path.traverse({
    JSXAttribute(path) {
      let attrName = path.get('name').node.name
      let valueExpression = path.get('value.expression')
      if (!ACTION_REX.test(attrName)) return

      replaceWithCallStatement(calleeName, valueExpression, anonymousFuncName)
    },
    JSXSpreadAttribute(path) {
      let argumentPath = path.get('argument')
      replaceSpreadWithCallStatement(compName, calleeName, argumentPath)
    }
  })
}

function babelPlugin({ template }) {
  const buildRequire = template(
    `var FUNC_NAME = require('babel-plugin-setname/lib/setname')`
  )

  return {
    name: 'babel-plugin-setname',
    visitor: {
      /**
       * @param {NodePath} path
       * @param state
       */
      Program(path, state) {
        if (!isNeedDealFile(state)) return
        const funcName = diCalleeName(state)
        const body = path.get('body')
        if (!body || body.length === 0 || hasRequire(body, funcName)) return

        const firstBody = body[0]
        if (firstBody) {
          firstBody.insertBefore(
            buildRequire({
              FUNC_NAME: funcName
            })
          )
        }
      },
      Function: visitorComponent,
      Class: visitorComponent
    }
  }
}

module.exports = babelPlugin
