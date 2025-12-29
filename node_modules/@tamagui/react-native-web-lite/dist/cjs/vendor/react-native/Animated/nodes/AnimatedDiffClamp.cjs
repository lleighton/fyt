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
var AnimatedDiffClamp_exports = {};
__export(AnimatedDiffClamp_exports, {
  AnimatedDiffClamp: () => AnimatedDiffClamp,
  default: () => AnimatedDiffClamp_default
});
module.exports = __toCommonJS(AnimatedDiffClamp_exports);
var import_AnimatedInterpolation = require("./AnimatedInterpolation.cjs"),
  import_AnimatedWithChildren = require("./AnimatedWithChildren.cjs");
class AnimatedDiffClamp extends import_AnimatedWithChildren.AnimatedWithChildren {
  _a;
  _min;
  _max;
  _value;
  _lastValue;
  constructor(a, min, max) {
    super(), this._a = a, this._min = min, this._max = max, this._value = this._lastValue = this._a.__getValue();
  }
  __makeNative(platformConfig) {
    this._a.__makeNative(platformConfig), super.__makeNative(platformConfig);
  }
  interpolate(config) {
    return new import_AnimatedInterpolation.AnimatedInterpolation(this, config);
  }
  __getValue() {
    const value = this._a.__getValue(),
      diff = value - this._lastValue;
    return this._lastValue = value, this._value = Math.min(Math.max(this._value + diff, this._min), this._max), this._value;
  }
  __attach() {
    this._a.__addChild(this);
  }
  __detach() {
    this._a.__removeChild(this), super.__detach();
  }
  __getNativeConfig() {
    return {
      type: "diffclamp",
      input: this._a.__getNativeTag(),
      min: this._min,
      max: this._max
    };
  }
}
var AnimatedDiffClamp_default = AnimatedDiffClamp;