import types from '@babel/types'
import { NodePath } from '@babel/traverse'
import { diCalleeName, isNeedDealFile, diMethodFromPackage } from './options'
import {
  getComponentName,
  replaceWithCallStatement,
  replaceSpreadWithCallStatement,
  ACTION_REX
} from './transform'
import { getIncrementId } from './nodetk'

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
 * @param isFunction 是不是函数组件访问器
 * TODO 在类组件中，类方法内返回的jsx部分代码中匿名函数名的取值作用域将使用Class，这可能不稳定
 */
function getComponentVisitor(isFunction = true) {
  return function (path, state) {
    if (!isNeedDealFile(state)) return
    const calleeName = diCalleeName(state)
    const compName = getComponentName(path)
    const anonymousFuncName = getIncrementId(compName + 'Func')

    const checkScope = scope => {
      const scopeNode = path.scope.block
      return !isFunction || !scope || scope.block === scopeNode
    }

    path.traverse({
      JSXAttribute(path) {
        if (!checkScope(path.scope)) return
        const attrName = path.get('name').node.name
        if (!ACTION_REX.test(attrName)) return

        replaceWithCallStatement(
          calleeName,
          path.get('value.expression'),
          anonymousFuncName
        )
      },
      JSXSpreadAttribute(path) {
        if (!checkScope(path.scope)) return
        const argumentPath = path.get('argument')
        replaceSpreadWithCallStatement(compName, calleeName, argumentPath)
      }
    })
  }
}

export default function ({ template }) {
  const buildRequire = template(`var FUNC_NAME = require("PACKAGE")`)

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
        const fromPackage = diMethodFromPackage(state)
        const body = path.get('body')
        if (!body || body.length === 0 || hasRequire(body, funcName)) return

        const firstBody = body[0]
        if (firstBody) {
          firstBody.insertBefore(
            buildRequire({
              FUNC_NAME: funcName,
              PACKAGE: fromPackage
            })
          )
        }
      },
      Function: getComponentVisitor(),
      Class: getComponentVisitor(false)
    }
  }
}
