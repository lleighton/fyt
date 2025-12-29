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
var AnimatedView_exports = {};
__export(AnimatedView_exports, {
  AnimatedView: () => AnimatedView,
  default: () => AnimatedView_default
});
module.exports = __toCommonJS(AnimatedView_exports);
var import_View = require("../../../../View/index.cjs"),
  import_createAnimatedComponent = require("../createAnimatedComponent.cjs");
const AnimatedView = (0, import_createAnimatedComponent.createAnimatedComponent)(import_View.View);
var AnimatedView_default = AnimatedView;