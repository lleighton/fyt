var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: !0 });
}, __copyProps = (to, from, except, desc) => {
  if (from && typeof from == "object" || typeof from == "function")
    for (let key of __getOwnPropNames(from))
      !__hasOwnProp.call(to, key) && key !== except && __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: !0 }), mod);
var FlagOff_exports = {};
__export(FlagOff_exports, {
  FlagOff: () => FlagOff
});
module.exports = __toCommonJS(FlagOff_exports);
var import_react = require("react"), import_react_native_svg = require("react-native-svg"), import_helpers_icon = require("@tamagui/helpers-icon"), import_jsx_runtime = require("react/jsx-runtime");
const FlagOff = (0, import_helpers_icon.themed)(
  (0, import_react.memo)(function(props) {
    const { color = "black", size = 24, ...otherProps } = props;
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      import_react_native_svg.Svg,
      {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: color,
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        ...otherProps,
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native_svg.Path, { d: "M8 2c3 0 5 2 8 2s4-1 4-1v11", stroke: color }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native_svg.Path, { d: "M4 22V4", stroke: color }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native_svg.Path, { d: "M4 15s1-1 4-1 5 2 8 2", stroke: color }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native_svg.Line, { x1: "2", x2: "22", y1: "2", y2: "22", stroke: color })
        ]
      }
    );
  })
);
//# sourceMappingURL=FlagOff.js.map
