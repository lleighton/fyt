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
var FileCog_exports = {};
__export(FileCog_exports, {
  FileCog: () => FileCog
});
module.exports = __toCommonJS(FileCog_exports);
var import_react = require("react"), import_react_native_svg = require("react-native-svg"), import_helpers_icon = require("@tamagui/helpers-icon"), import_jsx_runtime = require("react/jsx-runtime");
const FileCog = (0, import_helpers_icon.themed)(
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
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native_svg.Path, { d: "M14 2v4a2 2 0 0 0 2 2h4", stroke: color }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native_svg.Path, { d: "m2.305 15.53.923-.382", stroke: color }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native_svg.Path, { d: "m3.228 12.852-.924-.383", stroke: color }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            import_react_native_svg.Path,
            {
              d: "M4.677 21.5a2 2 0 0 0 1.313.5H18a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v2.5",
              stroke: color
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native_svg.Path, { d: "m4.852 11.228-.383-.923", stroke: color }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native_svg.Path, { d: "m4.852 16.772-.383.924", stroke: color }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native_svg.Path, { d: "m7.148 11.228.383-.923", stroke: color }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native_svg.Path, { d: "m7.53 17.696-.382-.924", stroke: color }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native_svg.Path, { d: "m8.772 12.852.923-.383", stroke: color }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native_svg.Path, { d: "m8.772 15.148.923.383", stroke: color }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native_svg.Circle, { cx: "6", cy: "14", r: "3", stroke: color })
        ]
      }
    );
  })
);
//# sourceMappingURL=FileCog.js.map
