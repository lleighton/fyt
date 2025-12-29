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
var createAnimatedComponent_exports = {};
__export(createAnimatedComponent_exports, {
  createAnimatedComponent: () => createAnimatedComponent,
  default: () => createAnimatedComponent_default
});
module.exports = __toCommonJS(createAnimatedComponent_exports);
var import_useAnimatedProps = require("./useAnimatedProps.cjs"),
  import_useMergeRefs = require("../Utilities/useMergeRefs.cjs"),
  React = __toESM(require("react"), 1),
  import_jsx_runtime = require("react/jsx-runtime");
function createAnimatedComponent(Component) {
  return React.forwardRef((props, forwardedRef) => {
    const [reducedProps, callbackRef] = (0, import_useAnimatedProps.useAnimatedProps)(props),
      ref = (0, import_useMergeRefs.useMergeRefs)(callbackRef, forwardedRef),
      {
        passthroughAnimatedPropExplicitValues,
        style
      } = reducedProps,
      {
        style: passthroughStyle,
        ...passthroughProps
      } = passthroughAnimatedPropExplicitValues ?? {};
    return /* @__PURE__ */(0, import_jsx_runtime.jsx)(Component, {
      ...reducedProps,
      ...passthroughProps,
      style: [style, passthroughStyle],
      ref
    });
  });
}
var createAnimatedComponent_default = createAnimatedComponent;