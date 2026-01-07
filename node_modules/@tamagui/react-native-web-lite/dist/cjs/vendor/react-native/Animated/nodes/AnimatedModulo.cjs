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
var AnimatedModulo_exports = {};
__export(AnimatedModulo_exports, {
  AnimatedModulo: () => AnimatedModulo,
  default: () => AnimatedModulo_default
});
module.exports = __toCommonJS(AnimatedModulo_exports);
var import_AnimatedInterpolation = require("./AnimatedInterpolation.cjs"),
  import_AnimatedWithChildren = require("./AnimatedWithChildren.cjs");
class AnimatedModulo extends import_AnimatedWithChildren.AnimatedWithChildren {
  _a;
  _modulus;
  constructor(a, modulus) {
    super(), this._a = a, this._modulus = modulus;
  }
  __makeNative(platformConfig) {
    this._a.__makeNative(platformConfig), super.__makeNative(platformConfig);
  }
  __getValue() {
    return (this._a.__getValue() % this._modulus + this._modulus) % this._modulus;
  }
  interpolate(config) {
    return new import_AnimatedInterpolation.AnimatedInterpolation(this, config);
  }
  __attach() {
    this._a.__addChild(this);
  }
  __detach() {
    this._a.__removeChild(this), super.__detach();
  }
  __getNativeConfig() {
    return {
      type: "modulus",
      input: this._a.__getNativeTag(),
      modulus: this._modulus
    };
  }
}
var AnimatedModulo_default = AnimatedModulo;