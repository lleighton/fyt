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
var AnimatedWithChildren_exports = {};
__export(AnimatedWithChildren_exports, {
  AnimatedWithChildren: () => AnimatedWithChildren,
  default: () => AnimatedWithChildren_default
});
module.exports = __toCommonJS(AnimatedWithChildren_exports);
var import_AnimatedNode = require("./AnimatedNode.cjs"),
  import_NativeAnimatedHelper = require("../NativeAnimatedHelper.cjs");
class AnimatedWithChildren extends import_AnimatedNode.AnimatedNode {
  _children;
  constructor() {
    super(), this._children = [];
  }
  __makeNative(platformConfig) {
    if (!this.__isNative) {
      this.__isNative = !0;
      for (const child of this._children) child.__makeNative(platformConfig), import_NativeAnimatedHelper.NativeAnimatedHelper.API.connectAnimatedNodes(this.__getNativeTag(), child.__getNativeTag());
    }
    super.__makeNative(platformConfig);
  }
  __addChild(child) {
    this._children.length === 0 && this.__attach(), this._children.push(child), this.__isNative && (child.__makeNative(this.__getPlatformConfig()), import_NativeAnimatedHelper.NativeAnimatedHelper.API.connectAnimatedNodes(this.__getNativeTag(), child.__getNativeTag()));
  }
  __removeChild(child) {
    const index = this._children.indexOf(child);
    if (index === -1) {
      console.warn("Trying to remove a child that doesn't exist");
      return;
    }
    this.__isNative && child.__isNative && import_NativeAnimatedHelper.NativeAnimatedHelper.API.disconnectAnimatedNodes(this.__getNativeTag(), child.__getNativeTag()), this._children.splice(index, 1), this._children.length === 0 && this.__detach();
  }
  __getChildren() {
    return this._children;
  }
  __callListeners(value) {
    if (super.__callListeners(value), !this.__isNative) for (const child of this._children) child.__getValue && child.__callListeners(child.__getValue());
  }
}
var AnimatedWithChildren_default = AnimatedWithChildren;