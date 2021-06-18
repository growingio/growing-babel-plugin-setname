const setName = require('../src/setname')

describe('测试setname', function () {
  it('for object', function () {
    const obj = {
      click() {},
      aaa: 1,
      bbb: () => {}
    }
    let so = setName('obj', obj)

    expect(so.click.name).toBe('obj$click')
    expect(so.bbb.name).toBe('obj$bbb')
    expect(so.aaa).toBe(1)
  })

  it('for array', function () {
    const arr = [() => {}, function bbb() {}, 'ccc']
    let na = setName('arr', arr)

    expect(na[0].name).toBe('arr$0')
    expect(na[1].name).toBe('arr$bbb')
    expect(na[2]).toBe('ccc')
  })

  it('for function', function () {
    let a = setName('abb', () => {})
    let b = setName('abc', function () {})
    let c = setName('abcd', b)

    expect(a.name).toBe('abb')
    expect(b.name).toBe('abc')
    expect(c.name).toBe('abc')
  })
})
