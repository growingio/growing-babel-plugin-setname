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
  return {
    name: 'babel-plugin-setname',
    visitor: {
      /**
       * @param {NodePath} path
       * @param state
       */
      Program(path, state) {
        if (!isNeedDealFile(state)) return
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
      Function: visitorComponent,
      Class: visitorComponent
    }
  }
}

module.exports = babelPlugin
