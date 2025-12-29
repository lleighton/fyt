var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf,
  __hasOwnProp = Object.prototype.hasOwnProperty;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
    value: mod,
    enumerable: !0
  }) : target, mod)),
  __toCommonJS = mod => __copyProps(__defProp({}, "__esModule", {
    value: !0
  }), mod);
var AnimatedSectionList_exports = {};
__export(AnimatedSectionList_exports, {
  SectionList: () => SectionList,
  default: () => AnimatedSectionList_default
});
module.exports = __toCommonJS(AnimatedSectionList_exports);
var React = __toESM(require("react"), 1),
  import_SectionList = require("../../../../SectionList.cjs"),
  import_createAnimatedComponent = require("../createAnimatedComponent.cjs"),
  import_jsx_runtime = require("react/jsx-runtime");
const SectionListWithEventThrottle = React.forwardRef((props, ref) => /* @__PURE__ */(0, import_jsx_runtime.jsx)(import_SectionList.SectionList, {
    scrollEventThrottle: 1e-4,
    ...props,
    ref
  })),
  SectionList = (0, import_createAnimatedComponent.createAnimatedComponent)(SectionListWithEventThrottle);
var AnimatedSectionList_default = SectionList;