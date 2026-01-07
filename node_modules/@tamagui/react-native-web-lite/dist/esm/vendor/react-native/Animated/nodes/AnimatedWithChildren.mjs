import { AnimatedNode } from "./AnimatedNode.mjs";
import { NativeAnimatedHelper } from "../NativeAnimatedHelper.mjs";
class AnimatedWithChildren extends AnimatedNode {
  _children;
  constructor() {
    super(), this._children = [];
  }
  __makeNative(platformConfig) {
    if (!this.__isNative) {
      this.__isNative = !0;
      for (const child of this._children) child.__makeNative(platformConfig), NativeAnimatedHelper.API.connectAnimatedNodes(this.__getNativeTag(), child.__getNativeTag());
    }
    super.__makeNative(platformConfig);
  }
  __addChild(child) {
    this._children.length === 0 && this.__attach(), this._children.push(child), this.__isNative && (child.__makeNative(this.__getPlatformConfig()), NativeAnimatedHelper.API.connectAnimatedNodes(this.__getNativeTag(), child.__getNativeTag()));
  }
  __removeChild(child) {
    const index = this._children.indexOf(child);
    if (index === -1) {
      console.warn("Trying to remove a child that doesn't exist");
      return;
    }
    this.__isNative && child.__isNative && NativeAnimatedHelper.API.disconnectAnimatedNodes(this.__getNativeTag(), child.__getNativeTag()), this._children.splice(index, 1), this._children.length === 0 && this.__detach();
  }
  __getChildren() {
    return this._children;
  }
  __callListeners(value) {
    if (super.__callListeners(value), !this.__isNative) for (const child of this._children) child.__getValue && child.__callListeners(child.__getValue());
  }
}
var AnimatedWithChildren_default = AnimatedWithChildren;
export { AnimatedWithChildren, AnimatedWithChildren_default as default };
//# sourceMappingURL=AnimatedWithChildren.mjs.map
