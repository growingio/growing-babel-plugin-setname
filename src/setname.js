module.exports = function (name, func) {
  if (typeof func === 'function' && !func.name) {
    Object.defineProperty(func, 'name', {
      value: name
    })
  }
  return func
}
