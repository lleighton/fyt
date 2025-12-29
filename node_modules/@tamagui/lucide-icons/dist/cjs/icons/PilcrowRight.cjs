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
var PilcrowRight_exports = {};
__export(PilcrowRight_exports, {
  PilcrowRight: () => PilcrowRight
});
module.exports = __toCommonJS(PilcrowRight_exports);
var import_react = require("react"),
  import_react_native_svg = require("react-native-svg"),
  import_helpers_icon = require("@tamagui/helpers-icon"),
  import_jsx_runtime = require("react/jsx-runtime");
const PilcrowRight = (0, import_helpers_icon.themed)((0, import_react.memo)(function (props) {
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
    children: [/* @__PURE__ */(0, import_jsx_runtime.jsx)(import_react_native_svg.Path, {
      d: "M10 3v11",
      stroke: color
    }), /* @__PURE__ */(0, import_jsx_runtime.jsx)(import_react_native_svg.Path, {
      d: "M10 9H7a1 1 0 0 1 0-6h8",
      stroke: color
    }), /* @__PURE__ */(0, import_jsx_runtime.jsx)(import_react_native_svg.Path, {
      d: "M14 3v11",
      stroke: color
    }), /* @__PURE__ */(0, import_jsx_runtime.jsx)(import_react_native_svg.Path, {
      d: "m18 14 4 4H2",
      stroke: color
    }), /* @__PURE__ */(0, import_jsx_runtime.jsx)(import_react_native_svg.Path, {
      d: "m22 18-4 4",
      stroke: color
    })]
  });
}));