import build from './helper/build'
import {
  transformJsxWithClass,
  transformJsxWithFunc,
  transformJsxWithArrows,
  transformJsx
} from './helper/babel.js'

describe('babel插件测试', function () {
  beforeAll(() => {
    return build()
  })

  it('测试bind方法', function () {
    let result = transformJsxWithClass(`
      <button onClick={this.doOnClick.bind(this)}/>
    `)

    expect(result[0].funcName).toBe('doOnClick')
  })

  it('标识符方法', function () {
    let result = transformJsxWithClass(`
      <button onClick={doOnClick}/>
    `)
    expect(result[0].funcName).toBe('doOnClick')
  })

  it('成员表达式', function () {
    let result = transformJsxWithClass(`
      <button onClick={this.handlerClick}/>
      <button onClick={this.props.handlerClick1}/>
      <button onClick={parent.props.handlerClick2}/>
      <button onClick={parent['props'].handlerClick3}/>
      <button onClick={this.parent['props'].handlerClick4}/>
      <button onClick={top.parent['props'].handlerClick5}/>
    `)

    expect(result[0].funcName).toBe('handlerClick')
    expect(result[1].funcName).toBe('props_handlerClick1')
    expect(result[2].funcName).toBe('parent_props_handlerClick2')
    expect(result[3].funcName).toBe('parent_props_handlerClick3')
    expect(result[4].funcName).toBe('parent_props_handlerClick4')
    expect(result[5].funcName).toBe('top_parent_props_handlerClick5')
  })

  it('函数执行表达式', function () {
    let result = transformJsxWithClass(`
      <button onClick={this.getHandler('12', 1)}/>
      <button onClick={props.getHandler(name, this)}/>
      <button onClick={getHandler([11, '12'], {key:1})}/>
      <button onClick={this.handlerClick.bind(this)}/>
      <button onClick={this.props.handlerClick1.bind(this)}/>
      <button onClick={this.props.getHandler(props)}/>
      <button onClick={getHandler(() => {})}/>
      <button onClick={getHandlerSym(Symbol(), Symbol('test'))}/>
      <button onClick={getHandlerEmpty(null, undefined)}/>
      <button onClick={getHandlerIllegal('a3)(^&*_$-')}/>
      <button onClick={getHandlerMax20('abcdefghijklmn1234567890')}/>
    `)

    expect(result[0].funcName).toBe('getHandler$12_1')
    expect(result[1].funcName).toBe('props_getHandler$name_this')
    expect(result[2].funcName).toBe('getHandler$$$2_$1')
    expect(result[3].funcName).toBe('handlerClick')
    expect(result[4].funcName).toBe('props_handlerClick1')
    expect(result[5].funcName).toBe('props_getHandler$props')
    expect(result[6].funcName).toBe('getHandler$$$$')
    expect(result[7].funcName).toBe('getHandlerSym$symbol_test')
    expect(result[8].funcName).toBe('getHandlerEmpty$null_undefined')
    expect(result[9].funcName).toBe('getHandlerIllegal$a3_$')
    expect(result[10].funcName).toBe('getHandlerMax20$abcdefghijklmn123456')
  })

  it('函数表达式', function () {
    let jsx = `
      <button onClick={(e) => {}}/>
      <button onClick={function() {}}/>
      <button onClick={function abc() {}}/>
    `
    let clsRes = transformJsxWithClass(jsx, 'Home')
    let funRes = transformJsxWithFunc(jsx, 'About')
    let arrowsRes = transformJsxWithArrows(jsx)

    expect(clsRes[0].funcName).toBe('HomeFunc0')
    expect(clsRes[1].funcName).toBe('HomeFunc1')
    expect(clsRes[2].funcName).toBe('abc')
    expect(funRes[0].funcName).toBe('AboutFunc0')
    expect(funRes[1].funcName).toBe('AboutFunc1')
    expect(funRes[2].funcName).toBe('abc')
    expect(arrowsRes[0].funcName).toBe('IndexFunc0')
    expect(arrowsRes[1].funcName).toBe('IndexFunc1')
    expect(arrowsRes[2].funcName).toBe('abc')
  })

  it('函数组件作用域', function () {
    let result = transformJsx(`
      const Home = () => {
        const Footer = () => {
          return (
            <div>
              <button onClick={() => {}}/>
              <button onClick={() => {}}/>
            </div>
          )
        }
        return (
          <div>
            <button onClick={(e) => {}}/>
            <Footer onClick={() => {}}/>
          </div>
        )
      }
    `)

    expect(result[0].funcName).toBe('FooterFunc0')
    expect(result[1].funcName).toBe('FooterFunc1')
    expect(result[2].funcName).toBe('HomeFunc0')
    expect(result[3].funcName).toBe('HomeFunc1')
  })

  it('默认导出函数组件', function () {
    let result = transformJsx(`
      export default function() {
        return (
          <div>
            <button onClick={(e) => {}}/>
          </div>
        )
      }
    `)
    expect(result[0].funcName).toBe('ComponentFunc0')
  })

  it('兼容Taro2升级', function () {
    const result = transformJsxWithFunc(
      `
      <button onClick={(e) => {}}/>
      <button onClick={function() {}}/>
    `,
      'Index',
      { lower: true }
    )

    expect(result[0].funcName).toBe('anonymousFunc0')
    expect(result[1].funcName).toBe('anonymousFunc1')
  })

  it('自定义test-1', function () {
    const result = transformJsxWithFunc(
      `
      <button onClick={() => {}}/>
      <button doClick={() => {}}/>
    `,
      'Index',
      { test: /^(do|on)[A-Z]\w+/ }
    )

    expect(result[0].funcName).toBe('IndexFunc0')
    expect(result[1].funcName).toBe('IndexFunc1')
  })

  it('自定义test-2', function () {
    const result = transformJsxWithFunc(
      `
      <button onClick={() => {}}/>
    `,
      'Index',
      { test: 'error' }
    )

    expect(result[0].funcName).toBe('IndexFunc0')
  })
})
