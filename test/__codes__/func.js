const Home = () => {
  const arrowsFunction = () => {}
  const anonymousFunction = function() {}
  function hasNameFunction() {}

  const handlers = {
    doClick() {}
  }

  function getHandler(name) {
    return function() {}
  }

  const factory = {
    buildHandler() {
      return function() {}
    }
  }

  const h1 = ""

  return (
    <View>
      <Button onClick={function abc(){}}/>
      <Button onClick={arrowsFunction}>箭头函数</Button>
      <Button onClick={anonymousFunction}>匿名函数</Button>
      <Button onClick={hasNameFunction}>具名函数</Button>
      <Button onClick={handlers.doClick.bind(this)}>成员函数1</Button>
      <Button onClick={handlers.doClick}>成员函数2</Button>
      <Button onClick={getHandler({
        key: 1, val: 2
      }, [1, 2, 3])}>高级函数1</Button>

      <Button onClick={getHandler('tab1')}>高阶函数2</Button>
      <Button onClick={getHandler(h1, this)}>高阶函数3</Button>
      <Button onClick={getHandler(['test'])}>高阶函数4</Button>

      <Button onClick={factory.buildHandler('tab2')}>高阶函数5</Button>
    </View>
  )
}
