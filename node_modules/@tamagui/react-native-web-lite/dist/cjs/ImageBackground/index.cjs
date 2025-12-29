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
var ImageBackground_exports = {};
__export(ImageBackground_exports, {
  ImageBackground: () => ImageBackground,
  default: () => ImageBackground_default
});
module.exports = __toCommonJS(ImageBackground_exports);
var import_react = require("react"),
  import_react_native_web_internals = require("@tamagui/react-native-web-internals"),
  import_Image = require("../Image/index.cjs"),
  import_View = require("../View/index.cjs"),
  import_jsx_runtime = require("react/jsx-runtime");
const emptyObject = {},
  ImageBackground = (0, import_react.forwardRef)((props, forwardedRef) => {
    const {
        children,
        style = emptyObject,
        imageStyle,
        imageRef,
        ...rest
      } = props,
      {
        height,
        width
      } = import_react_native_web_internals.StyleSheet.flatten(style);
    return /* @__PURE__ */(0, import_jsx_runtime.jsxs)(import_View.View, {
      ref: forwardedRef,
      style,
      children: [/* @__PURE__ */(0, import_jsx_runtime.jsx)(import_Image.Image, {
        ...rest,
        ref: imageRef,
        style: [{
          // Temporary Workaround:
          // Current (imperfect yet) implementation of <Image> overwrites width and height styles
          // (which is not quite correct), and these styles conflict with explicitly set styles
          // of <ImageBackground> and with our internal layout model here.
          // So, we have to proxy/reapply these styles explicitly for actual <Image> component.
          // This workaround should be removed after implementing proper support of
          // intrinsic content size of the <Image>.
          width,
          height,
          zIndex: -1
        }, import_react_native_web_internals.StyleSheet.absoluteFill, imageStyle]
      }), children]
    });
  });
ImageBackground.displayName = "ImageBackground";
var ImageBackground_default = ImageBackground;