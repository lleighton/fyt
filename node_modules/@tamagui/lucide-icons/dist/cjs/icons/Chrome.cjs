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
var Chrome_exports = {};
__export(Chrome_exports, {
  Chrome: () => Chrome
});
module.exports = __toCommonJS(Chrome_exports);
var import_react = require("react"),
  import_react_native_svg = require("react-native-svg"),
  import_helpers_icon = require("@tamagui/helpers-icon"),
  import_jsx_runtime = require("react/jsx-runtime");
const Chrome = (0, import_helpers_icon.themed)((0, import_react.memo)(function (props) {
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
    children: [/* @__PURE__ */(0, import_jsx_runtime.jsx)(import_react_native_svg.Circle, {
      cx: "12",
      cy: "12",
      r: "10",
      stroke: color
    }), /* @__PURE__ */(0, import_jsx_runtime.jsx)(import_react_native_svg.Circle, {
      cx: "12",
      cy: "12",
      r: "4",
      stroke: color
    }), /* @__PURE__ */(0, import_jsx_runtime.jsx)(import_react_native_svg.Line, {
      x1: "21.17",
      x2: "12",
      y1: "8",
      y2: "8",
      stroke: color
    }), /* @__PURE__ */(0, import_jsx_runtime.jsx)(import_react_native_svg.Line, {
      x1: "3.95",
      x2: "8.54",
      y1: "6.06",
      y2: "14",
      stroke: color
    }), /* @__PURE__ */(0, import_jsx_runtime.jsx)(import_react_native_svg.Line, {
      x1: "10.88",
      x2: "15.46",
      y1: "21.94",
      y2: "14",
      stroke: color
    })]
  });
}));