const babel = require('@babel/core')
const path = require('path')
const fs = require('fs')

const input = path.resolve(__dirname, '__codes__')
const output = path.resolve(__dirname, '__output__')
fs.mkdirSync(output, { recursive: true })

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
        './src/index.js',
        {
          includes: ['test/__codes__'],
          callee: '__setName__'
        }
      ]
    ]
  })

  fs.writeFileSync(path.join(output, filename), result.code)
})
