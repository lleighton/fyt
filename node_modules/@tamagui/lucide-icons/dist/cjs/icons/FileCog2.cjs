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
var FileCog2_exports = {};
__export(FileCog2_exports, {
  FileCog2: () => FileCog2
});
module.exports = __toCommonJS(FileCog2_exports);
var import_react = require("react"),
  import_react_native_svg = require("react-native-svg"),
  import_helpers_icon = require("@tamagui/helpers-icon"),
  import_jsx_runtime = require("react/jsx-runtime");
const FileCog2 = (0, import_helpers_icon.themed)((0, import_react.memo)(function (props) {
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
      d: "M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z",
      stroke: color
    }), /* @__PURE__ */(0, import_jsx_runtime.jsx)(import_react_native_svg.Polyline, {
      points: "14 2 14 8 20 8",
      stroke: color
    }), /* @__PURE__ */(0, import_jsx_runtime.jsx)(import_react_native_svg.Circle, {
      cx: "12",
      cy: "15",
      r: "2",
      stroke: color
    }), /* @__PURE__ */(0, import_jsx_runtime.jsx)(import_react_native_svg.Path, {
      d: "M12 12v1",
      stroke: color
    }), /* @__PURE__ */(0, import_jsx_runtime.jsx)(import_react_native_svg.Path, {
      d: "M12 17v1",
      stroke: color
    }), /* @__PURE__ */(0, import_jsx_runtime.jsx)(import_react_native_svg.Path, {
      d: "m14.6 13.5-.87.5",
      stroke: color
    }), /* @__PURE__ */(0, import_jsx_runtime.jsx)(import_react_native_svg.Path, {
      d: "m10.27 16-.87.5",
      stroke: color
    }), /* @__PURE__ */(0, import_jsx_runtime.jsx)(import_react_native_svg.Path, {
      d: "m14.6 16.5-.87-.5",
      stroke: color
    }), /* @__PURE__ */(0, import_jsx_runtime.jsx)(import_react_native_svg.Path, {
      d: "m10.27 14-.87-.5",
      stroke: color
    })]
  });
}));