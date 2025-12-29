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
var BrainCog_exports = {};
__export(BrainCog_exports, {
  BrainCog: () => BrainCog
});
module.exports = __toCommonJS(BrainCog_exports);
var import_react = require("react"), import_react_native_svg = require("react-native-svg"), import_helpers_icon = require("@tamagui/helpers-icon"), import_jsx_runtime = require("react/jsx-runtime");
const BrainCog = (0, import_helpers_icon.themed)(
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
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native_svg.Path, { d: "m10.852 14.772-.383.923", stroke: color }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native_svg.Path, { d: "m10.852 9.228-.383-.923", stroke: color }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native_svg.Path, { d: "m13.148 14.772.382.924", stroke: color }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native_svg.Path, { d: "m13.531 8.305-.383.923", stroke: color }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native_svg.Path, { d: "m14.772 10.852.923-.383", stroke: color }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native_svg.Path, { d: "m14.772 13.148.923.383", stroke: color }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            import_react_native_svg.Path,
            {
              d: "M17.598 6.5A3 3 0 1 0 12 5a3 3 0 0 0-5.63-1.446 3 3 0 0 0-.368 1.571 4 4 0 0 0-2.525 5.771",
              stroke: color
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native_svg.Path, { d: "M17.998 5.125a4 4 0 0 1 2.525 5.771", stroke: color }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native_svg.Path, { d: "M19.505 10.294a4 4 0 0 1-1.5 7.706", stroke: color }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            import_react_native_svg.Path,
            {
              d: "M4.032 17.483A4 4 0 0 0 11.464 20c.18-.311.892-.311 1.072 0a4 4 0 0 0 7.432-2.516",
              stroke: color
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native_svg.Path, { d: "M4.5 10.291A4 4 0 0 0 6 18", stroke: color }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native_svg.Path, { d: "M6.002 5.125a3 3 0 0 0 .4 1.375", stroke: color }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native_svg.Path, { d: "m9.228 10.852-.923-.383", stroke: color }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native_svg.Path, { d: "m9.228 13.148-.923.383", stroke: color }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native_svg.Circle, { cx: "12", cy: "12", r: "3", stroke: color })
        ]
      }
    );
  })
);
//# sourceMappingURL=BrainCog.js.map
