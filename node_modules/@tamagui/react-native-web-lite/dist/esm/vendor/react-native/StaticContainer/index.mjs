import * as React from "react";
class StaticContainer extends React.Component {
  shouldComponentUpdate(nextProps) {
    return !!nextProps.shouldUpdate;
  }
  render() {
    const child = this.props.children;
    return child === null || child === !1 ? null : React.Children.only(child);
  }
}
var StaticContainer_default = StaticContainer;
export { StaticContainer, StaticContainer_default as default };
//# sourceMappingURL=index.mjs.map
