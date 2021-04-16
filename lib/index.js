'use strict';

var require$$0$1 = require('@babel/traverse');
var require$$0 = require('path');
var types = require('@babel/types');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var require$$0__default$1 = /*#__PURE__*/_interopDefaultLegacy(require$$0$1);
var require$$0__default = /*#__PURE__*/_interopDefaultLegacy(require$$0);
var types__default = /*#__PURE__*/_interopDefaultLegacy(types);

var resolve = require$$0__default['default'].resolve;

function isNeedDealFile$1(state) {
  var opts = state.opts,
      filename = state.filename,
      cwd = state.cwd;
  var includes = opts.includes || ['src'];
  return includes.map(function (v) {
    return resolve(cwd, v);
  }).some(function (v) {
    return filename.startsWith(v);
  });
}

var diCalleeName$1 = function diCalleeName(_ref) {
  var opts = _ref.opts;
  return opts.callee || '_GIO_DI_NAME_';
};

var options = {
  isNeedDealFile: isNeedDealFile$1,
  diCalleeName: diCalleeName$1
};

require$$0__default$1['default'].NodePath;
var ACTION_REX$1 = /^on[A-Z][a-zA-Z]+/;

function getIncrementId$1() {
  var prefix = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '_';
  var i = 0;
  return function () {
    return prefix + i++;
  };
}

function getComponentName$1(componentPath) {}

var getPropertyValue = function getPropertyValue(node) {
  if (types__default['default'].isIdentifier(node)) {
    return node.name;
  }

  if (types__default['default'].isStringLiteral(node)) {
    return node.value;
  }

  return '';
};

var getNameByMemberExpression = function getNameByMemberExpression(node) {
  var object = node.object;
  var property = node.property;
  var propName = getPropertyValue(property);

  if (types__default['default'].isThisExpression(object)) {
    return propName;
  } else if (types__default['default'].isIdentifier(object)) {
    var name = object.name;
    return "".concat(name, "_").concat(propName);
  } else if (types__default['default'].isMemberExpression(object)) {
    var mpName = getPropertyValue(object.property);
    return "".concat(mpName, "_").concat(propName);
  }

  return propName;
};

var getNameByCallExpression = function getNameByCallExpression(node) {
  var callee = node.callee;
  var _arguments = node.arguments;

  var argString = _arguments.map(function (nv) {
    if (types__default['default'].isIdentifier(nv)) return nv.name;
    if (types__default['default'].isLiteral(nv)) return nv.value;
    if (types__default['default'].isObjectExpression(nv)) return '$';
    if (types__default['default'].isArrayExpression(nv)) return '$$';
    if (types__default['default'].isFunction(nv)) return '$$$';
    return '_';
  }).filter(Boolean).join('_');

  var callString = '';

  if (types__default['default'].isIdentifier(callee)) {
    callString = callee.name;
  } else if (types__default['default'].isMemberExpression(callee)) {
    callString = getNameByMemberExpression(callee);
  }

  if (callString || argString) {
    return "".concat(callString, "$").concat(argString);
  }

  return '';
};

var isSetNameCallExpression = function isSetNameCallExpression(calleeName, path) {
  var node = path.node;

  if (types__default['default'].isCallExpression(node)) {
    return node.callee.name === calleeName;
  }

  return false;
};

function replaceWithCallStatement$1(calleeName, expressionPath, anonymousFuncName) {
  if (!expressionPath) return;
  if (isSetNameCallExpression(calleeName, expressionPath)) return;
  var node = expressionPath.node;
  var functionName = '';

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

  var callExpr = types__default['default'].callExpression(types__default['default'].identifier(calleeName), [types__default['default'].stringLiteral(functionName), node]);
  return expressionPath.replaceWith(callExpr);
}

function replaceSpreadWithCallStatement$1(componentName, calleeName, argumentPath) {
  if (!argumentPath) return;
  if (isSetNameCallExpression(calleeName, argumentPath)) return;
  var argument = argumentPath.node;
  var name = '';

  if (types__default['default'].isIdentifier(argument)) {
    name = argument.name;
  } else if (types__default['default'].isMemberExpression(argument)) {
    name = getNameByMemberExpression(argument);
  }

  if (!name) {
    name = componentName || '_spread_';
  }

  var callExpr = types__default['default'].callExpression(types__default['default'].identifier(calleeName), [types__default['default'].stringLiteral(name), argument]);
  return argumentPath.replaceWith(callExpr);
}

var transform = {
  ACTION_REX: ACTION_REX$1,
  getIncrementId: getIncrementId$1,
  getComponentName: getComponentName$1,
  replaceWithCallStatement: replaceWithCallStatement$1,
  replaceSpreadWithCallStatement: replaceSpreadWithCallStatement$1
};

require$$0__default$1['default'].NodePath;
var diCalleeName = options.diCalleeName,
    isNeedDealFile = options.isNeedDealFile;
var getIncrementId = transform.getIncrementId,
    getComponentName = transform.getComponentName,
    replaceWithCallStatement = transform.replaceWithCallStatement,
    replaceSpreadWithCallStatement = transform.replaceSpreadWithCallStatement,
    ACTION_REX = transform.ACTION_REX;

function visitorComponent(path, state) {
  if (!isNeedDealFile(state)) return;
  var calleeName = diCalleeName(state);
  var compName = getComponentName(path);
  var anonymousFuncName = getIncrementId('anonymousFunc');
  path.traverse({
    JSXAttribute: function JSXAttribute(path) {
      var attrName = path.get('name').node.name;
      var valueExpression = path.get('value.expression');
      if (!ACTION_REX.test(attrName)) return;
      replaceWithCallStatement(calleeName, valueExpression, anonymousFuncName);
    },
    JSXSpreadAttribute: function JSXSpreadAttribute(path) {
      var argumentPath = path.get('argument');
      replaceSpreadWithCallStatement(compName, calleeName, argumentPath);
    }
  });
}

function babelPlugin(_ref) {
  var template = _ref.template;
  return {
    name: 'babel-plugin-setname',
    visitor: {
      Program: function Program(path, state) {
        if (!isNeedDealFile(state)) return;
        var firstBody = path.get('body.0');
        var buildRequire = template("var FUNC_NAME = require('babel-plugin-setname/lib/setname')");

        if (firstBody) {
          firstBody.insertBefore(buildRequire({
            FUNC_NAME: diCalleeName(state)
          }));
        }
      },
      Function: visitorComponent,
      Class: visitorComponent
    }
  };
}

var src = babelPlugin;

module.exports = src;
