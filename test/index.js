const babel = require('@babel/core')
const path = require('path')
const fs = require('fs')
const rollup = require('rollup')

const input = path.resolve(__dirname, '__codes__')
const output = path.resolve(__dirname, '__output__')
fs.mkdirSync(output, { recursive: true })
;(async () => {
  let result = await rollup.rollup({
    input: path.resolve(__dirname, '../src/index.js')
  })

  await result.write({
    format: 'cjs',
    file: path.resolve(__dirname, '../lib/index.js'),
    exports: 'default'
  })
})()

const files = fs.readdirSync(input)

files.forEach(filename => {
  const file = path.join(input, filename)
  let result = babel.transformFileSync(file, {
    presets: [
      [
        'taro',
        {
          framework: 'react',
          ts: false
        }
      ]
    ],
    plugins: [
      [
        './lib/index.js',
        {
          includes: ['test/__codes__'],
          package: '@gio/setname'
        }
      ]
    ]
  })

  fs.writeFileSync(path.join(output, filename), result.code)
})
