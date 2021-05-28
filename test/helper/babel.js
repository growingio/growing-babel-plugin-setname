import { transformSync } from '@babel/core'

function getOptions(options) {
  return {
    filename: 'src/index.js',
    presets: [
      [
        'taro',
        {
          framework: 'react',
          ts: false
        }
      ]
    ],
    plugins: [['./lib/index.js', options]]
  }
}

export function transformJsx(jsx, opts) {
  let result = transformSync(jsx, getOptions(opts))
  return getResultFunctions(result.code)
}

/**
 * 转化class类型的组件
 * @param jsx
 * @param classname
 * @param {{includes: string[], callee: string, package: string, lower: boolean}} opts
 * @returns {{funcName: string, sourceFunc: string, target: string}[]}
 */
export function transformJsxWithClass(jsx, classname = 'Index', opts = {}) {
  return transformJsx(
    `
    class ${classname} extends React.Component {
      render() {
        return <>${jsx}</>
      }
    }
  `,
    opts
  )
}

/**
 * 转化函数类型的组件
 * @param jsx
 * @param funcname
 * @param {{includes: string[], callee: string, package: string, lower: boolean}} opts
 * @returns {{funcName: string, sourceFunc: string, target: string}[]}
 */
export function transformJsxWithFunc(jsx, funcname = 'Index', opts = {}) {
  return transformJsx(
    `
    function ${funcname}() {
      return <>${jsx}</>
    }
  `,
    opts
  )
}

/**
 * 转化箭头函数类型的组件
 * @param jsx
 * @param identifier
 * @param {{includes: string[], callee: string, package: string, lower: boolean}} opts
 * @returns {{funcName: string, sourceFunc: string, target: string}[]}
 */
export function transformJsxWithArrows(jsx, identifier = 'Index', opts = {}) {
  return transformJsx(
    `
    const ${identifier} = () => {
      return <>${jsx}</>
    }
  `,
    opts
  )
}

/**
 * 读取转化或的结果函数
 * @param {string} code  转化后的代码
 * @returns {{funcName: string, sourceFunc: string, target: string}[]}
 */
export function getResultFunctions(code) {
  const line = code.replace(/[\n\r\t ]/g, '')
  const list = line.matchAll(/_GIO_DI_NAME_\("(.*?)",(.*?\)?)\)/g)
  return [...list]
    .map(group => {
      return {
        target: group[0],
        funcName: group[1],
        sourceFunc: group[2]
      }
    })
    .concat({
      target: line
    })
}
