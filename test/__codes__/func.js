const Home = (props) => {
  const {acc} = props

  function bbb() {}

  const ccc = () => {}

  const genFun = () => {
    return () => {}
  }

  const gens = {
    genFun(){}
  }

  return (
    <div>
      <button onClick={() => {}}>1</button>
      <button onClick={function aaa() {}}>2</button>
      <button onClick={function () {}}>3</button>
      <button onClick={bbb}>4</button>
      <button onClick={ccc}>5</button>
      <button name={1}>6</button>
      <button title={bbb()}>7</button>
      <button onClick={genFun("111", 12, ["aaa"], true)}>8</button>
      <button onClick={gens.genFun("222", gens, ()=>{})}>9</button>
      <button onClick={genFun(["bbb"], {})}>10</button>
      <button onClick={acc}>11</button>
      <button onClick={props.cbb}>12</button>
    </div>
  )
}

function f_ss_$_() {

}
