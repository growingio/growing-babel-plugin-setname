'use strict';

var types = require('@babel/types');
require('@babel/traverse');
var path = require('path');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var types__default = /*#__PURE__*/_interopDefaultLegacy(types);

function isNeedDealFile(state) {
  var opts = state.opts,
      filename = state.filename,
      cwd = state.cwd;
  var includes = opts.includes || ['src'];
  return includes.map(function (v) {
    return path.resolve(cwd, v);
  }).some(function (v) {
    return filename.startsWith(v);
  });
}
var diCalleeName = function diCalleeName(_ref) {
  var opts = _ref.opts;
  return opts.callee || '_GIO_DI_NAME_';
};
var isUpgradeFromTaro2 = function isUpgradeFromTaro2(_ref2) {
  var opts = _ref2.opts;
  return opts.lower || false;
};
function diMethodFromPackage(_ref3) {
  var opts = _ref3.opts;
  return opts["package"] || 'babel-plugin-setname/lib/setname';
}

function getIncrementId() {
  var prefix = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '_';
  var i = 0;
  return function () {
    return prefix + i++;
  };
}

function deleteIllegalChars(str) {
  return String(str).replace(/[^a-zA-Z0-9_$]/g, '');
}

function getLiteralValue(node) {
  if (types__default['default'].isNullLiteral(node)) return 'null';
  return deleteIllegalChars(node.value).slice(0, 20);
}
function isSymbol(node) {
  return types__default['default'].isCallExpression(node) && node.callee.name === 'Symbol';
}
function getSymbolDesc(node) {
  if (node.arguments[0]) {
    return getLiteralValue(node.arguments[0]);
  }

  return 'symbol';
}
function isThisMemberExpression(node) {
  return types__default['default'].isMemberExpression(node) && types__default['default'].isThisExpression(node.object);
}
function getPropertyValue(node) {
  if (types__default['default'].isIdentifier(node)) {
    return node.name;
  }

  if (types__default['default'].isStringLiteral(node)) {
    return node.value;
  }

  return '';
}
function getArrayLength(node) {
  return node && node.elements.length;
}
function getObjectKeyNumber(node) {
  return node && node.properties.length;
}
function isBindCallee(callee) {
  return callee && types__default['default'].isMemberExpression(callee) && getPropertyValue(callee.property) === 'bind';
}

var COMPONENT_FLAG = 'Component';
var ACTION_REX = /^on[A-Z][a-zA-Z]+/;

var getNameByMemberExpression = function getNameByMemberExpression(node) {
  var object = node.object;
  var property = node.property;
  var propName = getPropertyValue(property);

  if (types__default['default'].isThisExpression(object)) {
    return propName;
  }

  var name = '';

  if (types__default['default'].isIdentifier(object)) {
    name = object.name;
  } else if (types__default['default'].isMemberExpression(object)) {
    if (isThisMemberExpression(object)) {
      name = getPropertyValue(object.property);
    } else {
      name = getNameByMemberExpression(object);
    }
  }

  if (name) {
    return propName !== 'bind' ? "".concat(name, "_").concat(propName) : name;
  }

  return propName;
};

var getNameByCallExpression = function getNameByCallExpression(node) {
  var callee = node.callee;
  var _arguments = node.arguments;

  var argString = _arguments.map(function (nv) {
    if (types__default['default'].isIdentifier(nv)) return nv.name;
    if (types__default['default'].isLiteral(nv)) return getLiteralValue(nv);
    if (isSymbol(nv)) return getSymbolDesc(nv);
    if (types__default['default'].isObjectExpression(nv)) return '$' + getObjectKeyNumber(nv);
    if (types__default['default'].isArrayExpression(nv)) return '$$' + getArrayLength(nv);
    if (types__default['default'].isFunction(nv)) return '$$$';
    if (types__default['default'].isThisExpression(nv)) return 'this';
    return '_';
  }).filter(Boolean).join('_');

  var callString = '';

  if (types__default['default'].isIdentifier(callee)) {
    callString = callee.name;
  } else if (types__default['default'].isMemberExpression(callee)) {
    callString = getNameByMemberExpression(callee);
  }

  if (isBindCallee(callee) && argString === 'this') {
    argString = null;
  }

  if (callString || argString) {
    return "".concat(callString).concat(argString ? '$' + argString : '');
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

function getComponentName(componentPath) {
  var name;
  var id = componentPath.node.id;

  if (id) {
    name = id.name;
  } else {
    name = componentPath.parent && componentPath.parent.id && componentPath.parent.id.name;
  }

  return name || COMPONENT_FLAG;
}
function replaceWithCallStatement(calleeName, expressionPath, anonymousFuncName) {
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
function replaceSpreadWithCallStatement(componentName, calleeName, argumentPath) {
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
    name = !componentName || componentName === COMPONENT_FLAG ? '_spread_' : componentName;
  }

  var callExpr = types__default['default'].callExpression(types__default['default'].identifier(calleeName), [types__default['default'].stringLiteral(name), argument]);
  return argumentPath.replaceWith(callExpr);
}

function hasRequire(body, varName) {
  return body.some(function (path) {
    if (types__default['default'].isVariableDeclaration(path)) {
      var kind = path.node.kind;

      if (kind !== 'var') {
        return false;
      }

      var declarations = path.node.declarations;

      if (declarations.length !== 1) {
        return false;
      }

      var declarator = declarations[0];

      if (!types__default['default'].isVariableDeclarator(declarator)) {
        return false;
      }

      return declarator.id.name === varName && types__default['default'].isCallExpression(declarator.init) && declarator.init.callee.name === 'require' && declarator.init.arguments[0].value === 'babel-plugin-setname/lib/setname';
    }

    return false;
  });
}

function getComponentVisitor() {
  var isFunction = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
  return function (path, state) {
    if (!isNeedDealFile(state)) return;
    var calleeName = diCalleeName(state);
    var compName = getComponentName(path);
    var fromTaro2 = isUpgradeFromTaro2(state);
    var anonymousFuncName = getIncrementId(fromTaro2 ? 'anonymousFunc' : compName + 'Func');

    var checkScope = function checkScope(scope) {
      var scopeNode = path.scope.block;
      return !isFunction || !scope || scope.block === scopeNode;
    };

    path.traverse({
      JSXAttribute: function JSXAttribute(path) {
        if (!checkScope(path.scope)) return;
        var attrName = path.get('name').node.name;
        if (!ACTION_REX.test(attrName)) return;
        replaceWithCallStatement(calleeName, path.get('value.expression'), anonymousFuncName);
      },
      JSXSpreadAttribute: function JSXSpreadAttribute(path) {
        if (!checkScope(path.scope)) return;
        var argumentPath = path.get('argument');
        replaceSpreadWithCallStatement(compName, calleeName, argumentPath);
      }
    });
  };
}

function index (_ref) {
  var template = _ref.template;
  var buildRequire = template("var FUNC_NAME = require(\"PACKAGE\")");
  return {
    name: 'babel-plugin-setname',
    visitor: {
      Program: function Program(path, state) {
        if (!isNeedDealFile(state)) return;
        var funcName = diCalleeName(state);
        var fromPackage = diMethodFromPackage(state);
        var body = path.get('body');
        if (!body || body.length === 0 || hasRequire(body, funcName)) return;
        var firstBody = body[0];

        if (firstBody) {
          firstBody.insertBefore(buildRequire({
            FUNC_NAME: funcName,
            PACKAGE: fromPackage
          }));
        }
      },
      Function: getComponentVisitor(),
      Class: getComponentVisitor(false)
    }
  };
}

module.exports = index;
