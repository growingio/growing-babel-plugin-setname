const { resolve } = require('path')

/**
 * 判断当前文件是不是要处理
 * @param {{opts, filename, cwd}} state
 */
function isNeedDealFile(state) {
  let { opts, filename, cwd } = state
  let includes = opts.includes || ['src']
  return includes.map(v => resolve(cwd, v)).some(v => filename.startsWith(v))
}

// 获取设置名函数方法名
const diCalleeName = ({ opts }) => opts.callee || '_GIO_DI_NAME_'

// 获取设置函数名的方法来自哪个包
const diMethodFromPackage = ({ opts }) =>
  opts.package || 'babel-plugin-setname/lib/setname'

module.exports = {
  isNeedDealFile,
  diCalleeName,
  diMethodFromPackage
}
