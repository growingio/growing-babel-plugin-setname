class Class extends Component {
  constructor() {
    super();
  }

  // 这种先不支持
  actions = {
    onClick() {}
  }

  doOnClick() {}

  aaa() {}

  render() {
    return (
      <div {...this.actions}>
        <button onClick={this.doOnClick.bind(this)}/>
        <button onClick={this.doOnClick.bind({  })}/>
      </div>
    )
  }
}
