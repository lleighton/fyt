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
var AnimatedImage_exports = {};
__export(AnimatedImage_exports, {
  AnimatedImage: () => AnimatedImage,
  default: () => AnimatedImage_default
});
module.exports = __toCommonJS(AnimatedImage_exports);
var React = require("react"),
  import_Image = require("../../../../Image/index.cjs"),
  import_createAnimatedComponent = require("../createAnimatedComponent.cjs");
const AnimatedImage = (0, import_createAnimatedComponent.createAnimatedComponent)(import_Image.Image);
var AnimatedImage_default = AnimatedImage;