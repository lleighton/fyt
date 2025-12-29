var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
    for (var name in all) __defProp(target, name, {
      get: all[name],
      enumerable: !0
    });
  },
  __copyProps = (to, from, except, desc) => {
    if (from && typeof from == "object" || typeof from == "function") for (let key of __getOwnPropNames(from)) !__hasOwnProp.call(to, key) && key !== except && __defProp(to, key, {
      get: () => from[key],
      enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
    });
    return to;
  };
var __toCommonJS = mod => __copyProps(__defProp({}, "__esModule", {
  value: !0
}), mod);
var AnimatedStyle_exports = {};
__export(AnimatedStyle_exports, {
  AnimatedStyle: () => AnimatedStyle,
  default: () => AnimatedStyle_default
});
module.exports = __toCommonJS(AnimatedStyle_exports);
var import_AnimatedNode = require("./AnimatedNode.cjs"),
  import_AnimatedTransform = require("./AnimatedTransform.cjs"),
  import_AnimatedWithChildren = require("./AnimatedWithChildren.cjs"),
  import_NativeAnimatedHelper = require("../NativeAnimatedHelper.cjs"),
  import_react_native_web_internals = require("@tamagui/react-native-web-internals");
const flattenStyle = import_react_native_web_internals.StyleSheet.flatten;
function createAnimatedStyle(inputStyle) {
  const style = flattenStyle(inputStyle),
    animatedStyles = {};
  for (const key in style) {
    const value = style[key];
    key === "transform" && Array.isArray(value) ? animatedStyles[key] = new import_AnimatedTransform.AnimatedTransform(value) : value instanceof import_AnimatedNode.AnimatedNode ? animatedStyles[key] = value : value && !Array.isArray(value) && typeof value == "object" && (animatedStyles[key] = createAnimatedStyle(value));
  }
  return animatedStyles;
}
class AnimatedStyle extends import_AnimatedWithChildren.AnimatedWithChildren {
  _inputStyle;
  _style;
  constructor(style) {
    super(), this._inputStyle = style, this._style = createAnimatedStyle(style);
  }
  // Recursively get values for nested styles (like iOS's shadowOffset)
  _walkStyleAndGetValues(style) {
    const updatedStyle = {};
    for (const key in style) {
      const value = style[key];
      value instanceof import_AnimatedNode.AnimatedNode ? value.__isNative || (updatedStyle[key] = value.__getValue()) : value && !Array.isArray(value) && typeof value == "object" ? updatedStyle[key] = this._walkStyleAndGetValues(value) : updatedStyle[key] = value;
    }
    return updatedStyle;
  }
  __getValue() {
    return [this._inputStyle, this._walkStyleAndGetValues(this._style)];
  }
  // Recursively get animated values for nested styles (like iOS's shadowOffset)
  _walkStyleAndGetAnimatedValues(style) {
    const updatedStyle = {};
    for (const key in style) {
      const value = style[key];
      value instanceof import_AnimatedNode.AnimatedNode ? updatedStyle[key] = value.__getAnimatedValue() : value && !Array.isArray(value) && typeof value == "object" && (updatedStyle[key] = this._walkStyleAndGetAnimatedValues(value));
    }
    return updatedStyle;
  }
  __getAnimatedValue() {
    return this._walkStyleAndGetAnimatedValues(this._style);
  }
  __attach() {
    for (const key in this._style) {
      const value = this._style[key];
      value instanceof import_AnimatedNode.AnimatedNode && value.__addChild(this);
    }
  }
  __detach() {
    for (const key in this._style) {
      const value = this._style[key];
      value instanceof import_AnimatedNode.AnimatedNode && value.__removeChild(this);
    }
    super.__detach();
  }
  __makeNative() {
    for (const key in this._style) {
      const value = this._style[key];
      value instanceof import_AnimatedNode.AnimatedNode && value.__makeNative();
    }
    super.__makeNative();
  }
  __getNativeConfig() {
    const styleConfig = {};
    for (const styleKey in this._style) if (this._style[styleKey] instanceof import_AnimatedNode.AnimatedNode) {
      const style = this._style[styleKey];
      style.__makeNative(), styleConfig[styleKey] = style.__getNativeTag();
    }
    return import_NativeAnimatedHelper.NativeAnimatedHelper.validateStyles(styleConfig), {
      type: "style",
      style: styleConfig
    };
  }
}
var AnimatedStyle_default = AnimatedStyle;