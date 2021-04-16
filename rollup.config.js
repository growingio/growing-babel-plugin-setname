import babel from '@rollup/plugin-babel'
import commonjs from '@rollup/plugin-commonjs'
import { resolve } from 'path'

const extensions = ['.js']
const OUTPUT = 'lib'

function getOutput({ file, name, format = 'cjs' }) {
  return {
    file: resolve(OUTPUT, file),
    format,
    sourcemap: false,
    name
  }
}

export default [
  {
    input: 'src/index.js',
    output: getOutput({
      file: 'index.js'
    }),
    plugins: [
      commonjs(),
      babel({
        exclude: 'node_modules',
        babelHelpers: 'bundled',
        extensions
      })
    ]
  },
  {
    input: 'src/setname.js',
    output: getOutput({
      file: 'setname.js'
    })
  }
]
