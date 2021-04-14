'use strict';

var require$$0 = require('path');
var types = require('@babel/types');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var require$$0__default = /*#__PURE__*/_interopDefaultLegacy(require$$0);
var types__default = /*#__PURE__*/_interopDefaultLegacy(types);

var resolve = require$$0__default['default'].resolve;

function getIncrementId() {
  var prefix = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '_';
  var i = 0;
  return function () {
    return prefix + i++;
  };
}

function $identifier(name) {
  return types__default['default'].identifier("$".concat(name));
}

function getNameByIdtOrSL(node) {
  if (types__default['default'].isStringLiteral(node)) {
    return node.value;
  }

  if (types__default['default'].isIdentifier(node)) {
    return node.name;
  }

  return '_';
}

function hexHash(str) {
  var hash = 5381,
      i = str.length;

  while (i) {
    hash = hash * 33 ^ str.charCodeAt(--i);
  }

  return (hash >>> 0).toString(16);
}

function hasIdentifierName(identifier) {
  return identifier && !!identifier.name;
}

function isNoneFunction(path) {
  return !types__default['default'].isClassMethod(path) && !types__default['default'].isObjectMethod(path) && types__default['default'].isFunction(path) && !(hasIdentifierName(path.node.id) || hasIdentifierName(path.node.key));
}

function isSelfCallNoneFunction(path) {
  var parent = path.parent;
  return types__default['default'].isCallExpression(parent) && parent.callee === path.node;
}

function renameNoneFunction(path, keyGenerator) {
  if (!path) return;
  if (!isNoneFunction(path)) return;
  if (isSelfCallNoneFunction(path)) return;
  var body = path.node.body;

  if (types__default['default'].isExpression(body)) {
    body = types__default['default'].blockStatement([types__default['default'].returnStatement(body)]);
  }

  return path.replaceWith(types__default['default'].functionExpression(keyGenerator(path), path.node.params, body, path.node.generator, path.node.async));
}

function getRelativePath(state) {
  var cwd = state.cwd,
      filename = state.filename;
  return filename.replace(cwd, '').replace(/\\+/g, '/');
}

function isLikeDefinePropertyCallParam(func) {
  if (types__default['default'].isCallExpression(func.parent)) {
    var container = func.container;
    return !!container && func.key === 2 && container.length === 3 && types__default['default'].isStringLiteral(container[1]);
  }
}

function calcIdentifierByPath(path, getIdByFilepath) {
  var parent = path.parent;

  if (types__default['default'].isVariableDeclarator(parent)) {
    return types__default['default'].identifier(parent.id.name);
  }

  if (types__default['default'].isAssignmentExpression(parent) && parent.operator === '=') {
    var left = parent.left;

    if (types__default['default'].isMemberExpression(left)) {
      return $identifier(getNameByIdtOrSL(left.property));
    }

    if (types__default['default'].isIdentifier(left)) {
      return types__default['default'].identifier(left.name);
    }
  }

  if (isLikeDefinePropertyCallParam(path)) {
    var name = path.container[1].value;
    return types__default['default'].identifier(name);
  }

  return $identifier(getIdByFilepath());
}

function JSXAttributeVisitor(getName) {
  return function (path) {
    path.traverse({
      Function: function Function(funPath) {
        renameNoneFunction(funPath, function () {
          return types__default['default'].identifier(getName());
        });
      }
    });
  };
}

function isNeedDeal(state) {
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

function babelPlugin() {
  var idMap = {};

  function getIdByFilepath(filepath) {
    var id = idMap[filepath] || 0;
    return "".concat(filepath).concat(idMap[filepath] = ++id);
  }

  return {
    name: 'class-prop-function-rename',
    pre: function pre() {
      idMap = {};
    },
    visitor: {
      Class: function Class(path, state) {
        if (!isNeedDeal(state)) return;
        var jsxFuncIdentifier = getIncrementId('anonymousFunc');
        path.traverse({
          ClassProperty: function ClassProperty(propPath) {
            var key = propPath.get('key').node;
            var value = propPath.get('value');
            renameNoneFunction(value, function () {
              return key;
            });
          },
          JSXAttribute: JSXAttributeVisitor(jsxFuncIdentifier)
        });
      },
      Function: function Function(path, state) {
        if (!isNeedDeal(state)) return;
        var filepath = hexHash(getRelativePath(state));
        var renameResult = renameNoneFunction(path, function (self) {
          return calcIdentifierByPath(self, function () {
            return getIdByFilepath(filepath);
          });
        });

        if (!renameResult) {
          var jsxFuncIdentifier = getIncrementId('anonymousFunc');
          path.traverse({
            JSXAttribute: JSXAttributeVisitor(jsxFuncIdentifier)
          });
        }
      }
    }
  };
}

var src = babelPlugin;

module.exports = src;
