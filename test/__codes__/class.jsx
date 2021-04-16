class Class extends Component {
  constructor() {
    super();
  }

  // 这种先不支持
  actions = {
    onClick() {}
  }

  onClick() {}

  aaa() {}

  render() {
    return (
      <div {...this.actions}>
        <button onClick={() => {}}/>
        <button onClick={() => {}}/>
        <button onClick={this.aaa}/>
        <button onClick={this.actions['onClick']}/>
        <button onClick={this['onClick']}/>
      </div>
    )
  }
}
