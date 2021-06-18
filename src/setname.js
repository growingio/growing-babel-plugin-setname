function _isArray(obj) {
  return Object.prototype.toString.call(obj) === '[object Array]'
}

function _isObject(obj) {
  return Object.prototype.toString.call(obj) === '[object Object]'
}

function _defineNameWithNoneFunc(name, func, isFunc = false) {
  if (isFunc || typeof func === 'function') {
    Object.defineProperty(func, 'name', {
      value: name,
      writable: false,
      configurable: false
    })
  }
  return func
}

module.exports = function (name, object) {
  if (typeof object === 'function') {
    return _defineNameWithNoneFunc(object.name || name, object, true)
  }
  if (_isArray(object)) {
    let newArray = []
    for (let i = 0; i < object.length; i++) {
      let value = object[i]
      newArray[i] = _defineNameWithNoneFunc(
        name + '$' + (value.name || i),
        value
      )
    }
    return newArray
  }
  if (_isObject(object)) {
    let newObject = {}
    Object.keys(object).forEach(key => {
      newObject[key] = _defineNameWithNoneFunc(name + '$' + key, object[key])
    })
    return newObject
  }
  return _defineNameWithNoneFunc(name, object)
}
