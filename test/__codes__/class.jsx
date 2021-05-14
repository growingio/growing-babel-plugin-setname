class Class extends Component {
  constructor() {
    super();
  }

  // 这种先不支持
  actions = {
    onClick() {}
  }

  doOnClick() {}

  arrowsFunction = () => {}

  render() {
    return (
      <div {...this.actions}>
        <Button onClick={this.doOnClick.bind(this)}/>
        <Button onClick={this.arrowsFunction}></Button>
        <Button onClick={this.props.arrowsFunction}></Button>
      </div>
    )
  }
}
