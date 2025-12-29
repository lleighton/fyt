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
var SmartphoneNfc_exports = {};
__export(SmartphoneNfc_exports, {
  SmartphoneNfc: () => SmartphoneNfc
});
module.exports = __toCommonJS(SmartphoneNfc_exports);
var import_react = require("react"),
  import_react_native_svg = require("react-native-svg"),
  import_helpers_icon = require("@tamagui/helpers-icon"),
  import_jsx_runtime = require("react/jsx-runtime");
const SmartphoneNfc = (0, import_helpers_icon.themed)((0, import_react.memo)(function (props) {
  const {
    color = "black",
    size = 24,
    ...otherProps
  } = props;
  return /* @__PURE__ */(0, import_jsx_runtime.jsxs)(import_react_native_svg.Svg, {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    ...otherProps,
    children: [/* @__PURE__ */(0, import_jsx_runtime.jsx)(import_react_native_svg.Rect, {
      width: "7",
      height: "12",
      x: "2",
      y: "6",
      rx: "1",
      stroke: color
    }), /* @__PURE__ */(0, import_jsx_runtime.jsx)(import_react_native_svg.Path, {
      d: "M13 8.32a7.43 7.43 0 0 1 0 7.36",
      stroke: color
    }), /* @__PURE__ */(0, import_jsx_runtime.jsx)(import_react_native_svg.Path, {
      d: "M16.46 6.21a11.76 11.76 0 0 1 0 11.58",
      stroke: color
    }), /* @__PURE__ */(0, import_jsx_runtime.jsx)(import_react_native_svg.Path, {
      d: "M19.91 4.1a15.91 15.91 0 0 1 .01 15.8",
      stroke: color
    })]
  });
}));