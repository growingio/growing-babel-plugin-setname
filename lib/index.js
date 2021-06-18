'use strict';

var types = require('@babel/types');
require('@babel/traverse');
var path = require('path');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var types__default = /*#__PURE__*/_interopDefaultLegacy(types);

/**
 * 判断当前文件是不是要处理
 * @param {{opts, filename, cwd}} state
 */
function isNeedDealFile(state) {
  let { opts, filename, cwd } = state;
  let includes = opts.includes || ['src'];
  return includes.map(v => path.resolve(cwd, v)).some(v => filename.startsWith(v))
}

// 获取设置名函数方法名
const diCalleeName = ({ opts }) => opts.callee || '_GIO_DI_NAME_';

// 是不是从Taro2升级来的
const isUpgradeFromTaro2 = ({ opts }) => opts.lower || false;

// 获取设置函数名的方法来自哪个包
function diMethodFromPackage({ opts }) {
  return opts.package || 'babel-plugin-setname/lib/setname'
}

/**
 * @returns {RegExp}
 */
function getActionTest({ opts }) {
  try {
    if (opts.test instanceof RegExp) {
      return opts.test
    }
  } catch (e) {}
  return /^on[A-Z][a-zA-Z]+/
}

function getIncrementId(prefix = '_') {
  let i = 0;
  return function () {
    return prefix + i++
  }
}

function deleteIllegalChars(str) {
  return String(str).replace(/[^a-zA-Z0-9_$]/g, '')
}

function getLiteralValue(node) {
  if (types__default['default'].isNullLiteral(node)) return 'null'
  return deleteIllegalChars(node.value).slice(0, 20)
}

function isSymbol(node) {
  return types__default['default'].isCallExpression(node) && node.callee.name === 'Symbol'
}

function getSymbolDesc(node) {
  if (node.arguments[0]) {
    return getLiteralValue(node.arguments[0])
  }
  return 'symbol'
}

function isThisMemberExpression(node) {
  return types__default['default'].isMemberExpression(node) && types__default['default'].isThisExpression(node.object)
}

// 获取成员表达式property的值
function getPropertyValue(node) {
  if (types__default['default'].isIdentifier(node)) {
    return node.name
  }
  if (types__default['default'].isStringLiteral(node)) {
    return node.value
  }
  return ''
}

function getArrayLength(node) {
  return node && node.elements.length
}

function getObjectKeyNumber(node) {
  return node && node.properties.length
}

function isBindCallee(callee) {
  return (
    callee &&
    types__default['default'].isMemberExpression(callee) &&
    getPropertyValue(callee.property) === 'bind'
  )
}

const COMPONENT_FLAG = 'Component';

/**
 * 从成员表达式中获取函数名
 * 成员之间使用_连接
 * @param node callee
 * @return {string}
 */
const getNameByMemberExpression = node => {
  let object = node.object;
  let property = node.property;
  let propName = getPropertyValue(property);

  if (types__default['default'].isThisExpression(object)) {
    return propName
  }

  let name = '';
  if (types__default['default'].isIdentifier(object)) {
    name = object.name;
  } else if (types__default['default'].isMemberExpression(object)) {
    // this成员表达式处理 this.props.login => props_login
    if (isThisMemberExpression(object)) {
      name = getPropertyValue(object.property);
    } else {
      name = getNameByMemberExpression(object);
    }
  }

  if (name) {
    return propName !== 'bind' ? `${name}_${propName}` : name
  }

  return propName
};

/**
 * 从Call表达式中获取函数名
 * 函数名和参数之间使用使用$连接
 * @param node
 * @return {string}
 */
const getNameByCallExpression = node => {
  const callee = node.callee;
  const _arguments = node.arguments;
  let argString = _arguments
    .map(nv => {
      if (types__default['default'].isIdentifier(nv)) return nv.name
      if (types__default['default'].isLiteral(nv)) return getLiteralValue(nv)
      if (isSymbol(nv)) return getSymbolDesc(nv)
      if (types__default['default'].isObjectExpression(nv)) return '$' + getObjectKeyNumber(nv)
      if (types__default['default'].isArrayExpression(nv)) return '$$' + getArrayLength(nv)
      if (types__default['default'].isFunction(nv)) return '$$$'
      // this表达式为空参
      if (types__default['default'].isThisExpression(nv)) return 'this'
      return '_'
    })
    .filter(Boolean)
    .join('_');

  let callString = '';
  if (types__default['default'].isIdentifier(callee)) {
    callString = callee.name;
  } else if (types__default['default'].isMemberExpression(callee)) {
    callString = getNameByMemberExpression(callee);
  }

  if (isBindCallee(callee) && argString === 'this') {
    argString = null;
  }

  if (callString || argString) {
    return `${callString}${argString ? '$' + argString : ''}`
  }
  return ''
};

/**
 * 判断是否已经是被修改后的函数执行表达式
 */
const isSetNameCallExpression = (calleeName, path) => {
  let node = path.node;
  if (types__default['default'].isCallExpression(node)) {
    return node.callee.name === calleeName
  }
  return false
};

/**
 * 获取组件名
 * @param {NodePath} componentPath 组件路径
 * @return {string | null}
 */
function getComponentName(componentPath) {
  let name;
  let id = componentPath.node.id;
  if (id) {
    name = id.name;
  } else {
    name =
      componentPath.parent &&
      componentPath.parent.id &&
      componentPath.parent.id.name;
  }
  return name || COMPONENT_FLAG
}

/**
 * 使用执行语句替换函数声明和函数表达式
 *
 * @param {string} calleeName setName方法的函数名
 * @param {NodePath} expressionPath 当前jsx属性值路径
 * @param anonymousFuncName 用于生成匿名函数名
 */
function replaceWithCallStatement(
  calleeName,
  expressionPath,
  anonymousFuncName
) {
  if (!expressionPath) return
  if (isSetNameCallExpression(calleeName, expressionPath)) return
  const node = expressionPath.node;

  let functionName = '';
  if (types__default['default'].isFunctionExpression(node)) {
    functionName = node.id ? node.id.name : '';
  } else if (types__default['default'].isIdentifier(node)) {
    functionName = node.name;
  } else if (types__default['default'].isMemberExpression(node)) {
    functionName = getNameByMemberExpression(node);
  } else if (types__default['default'].isCallExpression(node)) {
    functionName = getNameByCallExpression(node);
  }

  if (!functionName) {
    functionName = anonymousFuncName();
  }

  const callExpr = types__default['default'].callExpression(types__default['default'].identifier(calleeName), [
    types__default['default'].stringLiteral(functionName),
    node
  ]);

  return expressionPath.replaceWith(callExpr)
}

/**
 * 使用call执行方法替换展开参数
 *
 * @param {string} componentName 当前组件名 暂为空
 * @param {string} calleeName
 * @param {NodePath} argumentPath
 */
function replaceSpreadWithCallStatement(
  componentName,
  calleeName,
  argumentPath
) {
  if (!argumentPath) return
  if (isSetNameCallExpression(calleeName, argumentPath)) return
  const argument = argumentPath.node;
  let name = '';

  if (types__default['default'].isIdentifier(argument)) {
    name = argument.name;
  } else if (types__default['default'].isMemberExpression(argument)) {
    name = getNameByMemberExpression(argument);
  }

  if (!name) {
    name =
      !componentName || componentName === COMPONENT_FLAG
        ? '_spread_'
        : componentName;
  }

  const callExpr = types__default['default'].callExpression(types__default['default'].identifier(calleeName), [
    types__default['default'].stringLiteral(name),
    argument
  ]);

  return argumentPath.replaceWith(callExpr)
}

/**
 * 判断是不是已经添加过导入语句
 * @param {NodePath[]} body
 * @param {string} varName
 * @return {boolean}
 */
function hasRequire(body, varName) {
  return body.some(path => {
    if (types__default['default'].isVariableDeclaration(path)) {
      const kind = path.node.kind;
      if (kind !== 'var') {
        return false
      }

      const declarations = path.node.declarations;
      if (declarations.length !== 1) {
        return false
      }

      const declarator = declarations[0];
      if (!types__default['default'].isVariableDeclarator(declarator)) {
        return false
      }

      return (
        declarator.id.name === varName &&
        types__default['default'].isCallExpression(declarator.init) &&
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
    const calleeName = diCalleeName(state);
    const compName = getComponentName(path);
    const fromTaro2 = isUpgradeFromTaro2(state);
    const anonymousFuncName = getIncrementId(
      fromTaro2 ? 'anonymousFunc' : compName + 'Func'
    );

    const checkScope = scope => {
      const scopeNode = path.scope.block;
      return !isFunction || !scope || scope.block === scopeNode
    };

    path.traverse({
      JSXAttribute(path) {
        if (!checkScope(path.scope)) return
        const attrName = path.get('name').node.name;
        if (!getActionTest(state).test(attrName)) return

        replaceWithCallStatement(
          calleeName,
          path.get('value.expression'),
          anonymousFuncName
        );
      },
      JSXSpreadAttribute(path) {
        if (!checkScope(path.scope)) return
        const argumentPath = path.get('argument');
        replaceSpreadWithCallStatement(compName, calleeName, argumentPath);
      }
    });
  }
}

function index ({ template }) {
  const buildRequire = template(`var FUNC_NAME = require("PACKAGE")`);

  return {
    name: 'babel-plugin-setname',
    visitor: {
      /**
       * @param {NodePath} path
       * @param state
       */
      Program(path, state) {
        if (!isNeedDealFile(state)) return
        const funcName = diCalleeName(state);
        const fromPackage = diMethodFromPackage(state);
        const body = path.get('body');
        if (!body || body.length === 0 || hasRequire(body, funcName)) return

        const firstBody = body[0];
        if (firstBody) {
          firstBody.insertBefore(
            buildRequire({
              FUNC_NAME: funcName,
              PACKAGE: fromPackage
            })
          );
        }
      },
      Function: getComponentVisitor(),
      Class: getComponentVisitor(false)
    }
  }
}

module.exports = index;
