const setName = require('../src/setname')

const obj = {
  click() {},
  aaa: 1,
  bbb: () => {}
}

let no = setName('obj', obj)

console.log(no.click.name)
console.log(no.aaa.name)
console.log(no.bbb.name)

const arr = [() => {}, function bbb() {}, 'ccc']

let na = setName('arr', arr)

console.log(na[0].name)
console.log(na[1].name)
console.log(na[2].name)

const abb = () => {}

let b = setName('abb', abb)

console.log(b.name)
