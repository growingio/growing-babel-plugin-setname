import types from '@babel/types'
import { NodePath } from '@babel/traverse'
import {
  getLiteralValue,
  isSymbol,
  getPropertyValue,
  getSymbolDesc,
  isThisMemberExpression,
  getArrayLength,
  getObjectKeyNumber
} from './nodetk'

export const ACTION_REX = /^on[A-Z][a-zA-Z]+/

/**
 * 从成员表达式中获取函数名
 * 成员之间使用_连接
 * @param node callee
 * @return {string}
 */
const getNameByMemberExpression = node => {
  let object = node.object
  let property = node.property
  let propName = getPropertyValue(property)

  if (types.isThisExpression(object)) {
    return propName
  }

  let name = ''
  if (types.isIdentifier(object)) {
    name = object.name
  } else if (types.isMemberExpression(object)) {
    // this成员表达式处理 this.props.login => props_login
    if (isThisMemberExpression(object)) {
      name = getPropertyValue(object.property)
    } else {
      name = getNameByMemberExpression(object)
    }
  }

  if (name) {
    return propName !== 'bind' ? `${name}_${propName}` : name
  }

  return propName
}

/**
 * 从Call表达式中获取函数名
 * 函数名和参数之间使用使用$连接
 * @param node
 * @return {string}
 */
const getNameByCallExpression = node => {
  const callee = node.callee
  const _arguments = node.arguments
  const argString = _arguments
    .map(nv => {
      if (types.isIdentifier(nv)) return nv.name
      if (types.isLiteral(nv)) return getLiteralValue(nv)
      if (isSymbol(nv)) return getSymbolDesc(nv)
      if (types.isObjectExpression(nv)) return '$' + getObjectKeyNumber(nv)
      if (types.isArrayExpression(nv)) return '$$' + getArrayLength(nv)
      if (types.isFunction(nv)) return '$$$'
      // this表达式为空参
      if (types.isThisExpression(nv)) return 'this'
      return '_'
    })
    .filter(Boolean)
    .join('_')

  let callString = ''
  if (types.isIdentifier(callee)) {
    callString = callee.name
  } else if (types.isMemberExpression(callee)) {
    callString = getNameByMemberExpression(callee)
  }

  if (callString || argString) {
    return `${callString}${argString ? '$' + argString : ''}`
  }
  return ''
}

/**
 * 判断是否已经是被修改后的函数执行表达式
 */
const isSetNameCallExpression = (calleeName, path) => {
  let node = path.node
  if (types.isCallExpression(node)) {
    return node.callee.name === calleeName
  }
  return false
}

/**
 * 获取组件名
 * @param {NodePath} componentPath 组件路径
 * @return {string | null}
 */
export function getComponentName(componentPath) {}

/**
 * 使用执行语句替换函数声明和函数表达式
 *
 * @param {string} calleeName setName方法的函数名
 * @param {NodePath} expressionPath 当前jsx属性值路径
 * @param anonymousFuncName 用于生成匿名函数名
 */
export function replaceWithCallStatement(
  calleeName,
  expressionPath,
  anonymousFuncName
) {
  if (!expressionPath) return
  if (isSetNameCallExpression(calleeName, expressionPath)) return
  const node = expressionPath.node

  let functionName = ''
  if (types.isFunctionExpression(node)) {
    functionName = node.id ? node.id.name : ''
  } else if (types.isIdentifier(node)) {
    functionName = node.name
  } else if (types.isMemberExpression(node)) {
    functionName = getNameByMemberExpression(node)
  } else if (types.isCallExpression(node)) {
    functionName = getNameByCallExpression(node)
  }

  if (!functionName) {
    functionName = anonymousFuncName()
  }

  const callExpr = types.callExpression(types.identifier(calleeName), [
    types.stringLiteral(functionName),
    node
  ])

  return expressionPath.replaceWith(callExpr)
}

/**
 * 使用call执行方法替换展开参数
 *
 * @param {string} componentName 当前组件名 暂为空
 * @param {string} calleeName
 * @param {NodePath} argumentPath
 */
export function replaceSpreadWithCallStatement(
  componentName,
  calleeName,
  argumentPath
) {
  if (!argumentPath) return
  if (isSetNameCallExpression(calleeName, argumentPath)) return
  const argument = argumentPath.node
  let name = ''

  if (types.isIdentifier(argument)) {
    name = argument.name
  } else if (types.isMemberExpression(argument)) {
    name = getNameByMemberExpression(argument)
  }

  if (!name) {
    name = componentName || '_spread_'
  }

  const callExpr = types.callExpression(types.identifier(calleeName), [
    types.stringLiteral(name),
    argument
  ])

  return argumentPath.replaceWith(callExpr)
}
