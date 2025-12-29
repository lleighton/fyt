import { dangerousStyleValue } from "./dangerousStyleValue.mjs";
function setValueForStyles(node, styles) {
  const style = node.style;
  for (let styleName in styles) {
    if (!styles.hasOwnProperty(styleName)) continue;
    const isCustomProperty = styleName.indexOf("--") === 0,
      styleValue = dangerousStyleValue(styleName, styles[styleName], isCustomProperty);
    styleName === "float" && (styleName = "cssFloat"), isCustomProperty ? style.setProperty(styleName, styleValue) : style[styleName] = styleValue;
  }
}
export { setValueForStyles };
//# sourceMappingURL=index.mjs.map
