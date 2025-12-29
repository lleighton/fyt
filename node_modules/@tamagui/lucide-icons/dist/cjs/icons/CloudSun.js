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
var CloudSun_exports = {};
__export(CloudSun_exports, {
  CloudSun: () => CloudSun
});
module.exports = __toCommonJS(CloudSun_exports);
var import_react = require("react"), import_react_native_svg = require("react-native-svg"), import_helpers_icon = require("@tamagui/helpers-icon"), import_jsx_runtime = require("react/jsx-runtime");
const CloudSun = (0, import_helpers_icon.themed)(
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
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native_svg.Path, { d: "M12 2v2", stroke: color }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native_svg.Path, { d: "m4.93 4.93 1.41 1.41", stroke: color }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native_svg.Path, { d: "M20 12h2", stroke: color }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native_svg.Path, { d: "m19.07 4.93-1.41 1.41", stroke: color }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native_svg.Path, { d: "M15.947 12.65a4 4 0 0 0-5.925-4.128", stroke: color }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_native_svg.Path, { d: "M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z", stroke: color })
        ]
      }
    );
  })
);
//# sourceMappingURL=CloudSun.js.map
