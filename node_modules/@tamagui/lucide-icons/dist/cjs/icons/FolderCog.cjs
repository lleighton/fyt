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
var FolderCog_exports = {};
__export(FolderCog_exports, {
  FolderCog: () => FolderCog
});
module.exports = __toCommonJS(FolderCog_exports);
var import_react = require("react"),
  import_react_native_svg = require("react-native-svg"),
  import_helpers_icon = require("@tamagui/helpers-icon"),
  import_jsx_runtime = require("react/jsx-runtime");
const FolderCog = (0, import_helpers_icon.themed)((0, import_react.memo)(function (props) {
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
      d: "M10.3 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.98a2 2 0 0 1 1.69.9l.66 1.2A2 2 0 0 0 12 6h8a2 2 0 0 1 2 2v3.3",
      stroke: color
    }), /* @__PURE__ */(0, import_jsx_runtime.jsx)(import_react_native_svg.Path, {
      d: "m14.305 19.53.923-.382",
      stroke: color
    }), /* @__PURE__ */(0, import_jsx_runtime.jsx)(import_react_native_svg.Path, {
      d: "m15.228 16.852-.923-.383",
      stroke: color
    }), /* @__PURE__ */(0, import_jsx_runtime.jsx)(import_react_native_svg.Path, {
      d: "m16.852 15.228-.383-.923",
      stroke: color
    }), /* @__PURE__ */(0, import_jsx_runtime.jsx)(import_react_native_svg.Path, {
      d: "m16.852 20.772-.383.924",
      stroke: color
    }), /* @__PURE__ */(0, import_jsx_runtime.jsx)(import_react_native_svg.Path, {
      d: "m19.148 15.228.383-.923",
      stroke: color
    }), /* @__PURE__ */(0, import_jsx_runtime.jsx)(import_react_native_svg.Path, {
      d: "m19.53 21.696-.382-.924",
      stroke: color
    }), /* @__PURE__ */(0, import_jsx_runtime.jsx)(import_react_native_svg.Path, {
      d: "m20.772 16.852.924-.383",
      stroke: color
    }), /* @__PURE__ */(0, import_jsx_runtime.jsx)(import_react_native_svg.Path, {
      d: "m20.772 19.148.924.383",
      stroke: color
    }), /* @__PURE__ */(0, import_jsx_runtime.jsx)(import_react_native_svg.Circle, {
      cx: "18",
      cy: "18",
      r: "3",
      stroke: color
    })]
  });
}));