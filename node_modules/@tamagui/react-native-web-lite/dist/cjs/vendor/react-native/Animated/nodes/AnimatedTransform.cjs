"use strict";

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
var AnimatedTransform_exports = {};
__export(AnimatedTransform_exports, {
  AnimatedTransform: () => AnimatedTransform,
  default: () => AnimatedTransform_default
});
module.exports = __toCommonJS(AnimatedTransform_exports);
var import_AnimatedNode = require("./AnimatedNode.cjs"),
  import_AnimatedWithChildren = require("./AnimatedWithChildren.cjs"),
  import_NativeAnimatedHelper = require("../NativeAnimatedHelper.cjs");
class AnimatedTransform extends import_AnimatedWithChildren.AnimatedWithChildren {
  _transforms;
  constructor(transforms) {
    super(), this._transforms = transforms;
  }
  __makeNative() {
    this._transforms.forEach(transform => {
      for (const key in transform) {
        const value = transform[key];
        value instanceof import_AnimatedNode.AnimatedNode && value.__makeNative();
      }
    }), super.__makeNative();
  }
  __getValue() {
    return this._transforms.map(transform => {
      const result = {};
      for (const key in transform) {
        const value = transform[key];
        value instanceof import_AnimatedNode.AnimatedNode ? result[key] = value.__getValue() : result[key] = value;
      }
      return result;
    });
  }
  __getAnimatedValue() {
    return this._transforms.map(transform => {
      const result = {};
      for (const key in transform) {
        const value = transform[key];
        value instanceof import_AnimatedNode.AnimatedNode ? result[key] = value.__getAnimatedValue() : result[key] = value;
      }
      return result;
    });
  }
  __attach() {
    this._transforms.forEach(transform => {
      for (const key in transform) {
        const value = transform[key];
        value instanceof import_AnimatedNode.AnimatedNode && value.__addChild(this);
      }
    });
  }
  __detach() {
    this._transforms.forEach(transform => {
      for (const key in transform) {
        const value = transform[key];
        value instanceof import_AnimatedNode.AnimatedNode && value.__removeChild(this);
      }
    }), super.__detach();
  }
  __getNativeConfig() {
    const transConfigs = [];
    return this._transforms.forEach(transform => {
      for (const key in transform) {
        const value = transform[key];
        value instanceof import_AnimatedNode.AnimatedNode ? transConfigs.push({
          type: "animated",
          property: key,
          nodeTag: value.__getNativeTag()
        }) : transConfigs.push({
          type: "static",
          property: key,
          value: import_NativeAnimatedHelper.NativeAnimatedHelper.transformDataType(value)
        });
      }
    }), import_NativeAnimatedHelper.NativeAnimatedHelper.validateTransform(transConfigs), {
      type: "transform",
      transforms: transConfigs
    };
  }
}
var AnimatedTransform_default = AnimatedTransform;