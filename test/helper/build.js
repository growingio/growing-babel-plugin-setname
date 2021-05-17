const path = require('path')
const rollup = require('rollup')

export default function () {
  return rollup
    .rollup({
      input: path.resolve(__dirname, '../../src/index.js'),
      onwarn() {}
    })
    .then(result => {
      return result.write({
        format: 'cjs',
        file: path.resolve(__dirname, '../../lib/index.js'),
        exports: 'default'
      })
    })
}
