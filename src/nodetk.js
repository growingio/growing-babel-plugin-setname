import types from '@babel/types'

export function getIncrementId(prefix = '_') {
  let i = 0
  return function () {
    return prefix + i++
  }
}

function deleteIllegalChars(str) {
  return String(str).replace(/[^a-zA-Z0-9_$]/g, '')
}

export function getLiteralValue(node) {
  if (types.isNullLiteral(node)) return 'null'
  return deleteIllegalChars(node.value).slice(0, 20)
}

export function isSymbol(node) {
  return types.isCallExpression(node) && node.callee.name === 'Symbol'
}

export function getSymbolDesc(node) {
  if (node.arguments[0]) {
    return getLiteralValue(node.arguments[0])
  }
  return 'symbol'
}

export function isThisMemberExpression(node) {
  return types.isMemberExpression(node) && types.isThisExpression(node.object)
}

// 获取成员表达式property的值
export function getPropertyValue(node) {
  if (types.isIdentifier(node)) {
    return node.name
  }
  if (types.isStringLiteral(node)) {
    return node.value
  }
  return ''
}

export function getArrayLength(node) {
  return node && node.elements.length
}

export function getObjectKeyNumber(node) {
  return node && node.properties.length
}
