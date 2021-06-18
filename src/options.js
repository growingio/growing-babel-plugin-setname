import { resolve } from 'path'

/**
 * 判断当前文件是不是要处理
 * @param {{opts, filename, cwd}} state
 */
export function isNeedDealFile(state) {
  let { opts, filename, cwd } = state
  let includes = opts.includes || ['src']
  return includes.map(v => resolve(cwd, v)).some(v => filename.startsWith(v))
}

// 获取设置名函数方法名
export const diCalleeName = ({ opts }) => opts.callee || '_GIO_DI_NAME_'

// 是不是从Taro2升级来的
export const isUpgradeFromTaro2 = ({ opts }) => opts.lower || false

// 获取设置函数名的方法来自哪个包
export function diMethodFromPackage({ opts }) {
  return opts.package || 'babel-plugin-setname/lib/setname'
}

/**
 * @returns {RegExp}
 */
export function getActionTest({ opts }) {
  try {
    if (opts.test instanceof RegExp) {
      return opts.test
    }
  } catch (e) {}
  return /^on[A-Z][a-zA-Z]+/
}
