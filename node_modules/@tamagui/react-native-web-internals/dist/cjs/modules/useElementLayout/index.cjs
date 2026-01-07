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
var useElementLayout_exports = {};
__export(useElementLayout_exports, {
  useElementLayout: () => useElementLayout
});
module.exports = __toCommonJS(useElementLayout_exports);
var import_use_element_layout = require("@tamagui/use-element-layout"),
  import_react = require("react");
function useElementLayout(ref, onLayout) {
  const wrappedRef = (0, import_react.useMemo)(() => ({
    current: {
      get host() {
        return ref.current;
      }
    }
  }), [ref]);
  return (0, import_react.useEffect)(() => {
    (0, import_use_element_layout.enable)();
  }, []), (0, import_use_element_layout.useElementLayout)(wrappedRef, onLayout);
}