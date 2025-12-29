import { AnimatedNode } from "./AnimatedNode.mjs";
import { AnimatedWithChildren } from "./AnimatedWithChildren.mjs";
import { NativeAnimatedHelper } from "../NativeAnimatedHelper.mjs";
class AnimatedTransform extends AnimatedWithChildren {
  _transforms;
  constructor(transforms) {
    super(), this._transforms = transforms;
  }
  __makeNative() {
    this._transforms.forEach(transform => {
      for (const key in transform) {
        const value = transform[key];
        value instanceof AnimatedNode && value.__makeNative();
      }
    }), super.__makeNative();
  }
  __getValue() {
    return this._transforms.map(transform => {
      const result = {};
      for (const key in transform) {
        const value = transform[key];
        value instanceof AnimatedNode ? result[key] = value.__getValue() : result[key] = value;
      }
      return result;
    });
  }
  __getAnimatedValue() {
    return this._transforms.map(transform => {
      const result = {};
      for (const key in transform) {
        const value = transform[key];
        value instanceof AnimatedNode ? result[key] = value.__getAnimatedValue() : result[key] = value;
      }
      return result;
    });
  }
  __attach() {
    this._transforms.forEach(transform => {
      for (const key in transform) {
        const value = transform[key];
        value instanceof AnimatedNode && value.__addChild(this);
      }
    });
  }
  __detach() {
    this._transforms.forEach(transform => {
      for (const key in transform) {
        const value = transform[key];
        value instanceof AnimatedNode && value.__removeChild(this);
      }
    }), super.__detach();
  }
  __getNativeConfig() {
    const transConfigs = [];
    return this._transforms.forEach(transform => {
      for (const key in transform) {
        const value = transform[key];
        value instanceof AnimatedNode ? transConfigs.push({
          type: "animated",
          property: key,
          nodeTag: value.__getNativeTag()
        }) : transConfigs.push({
          type: "static",
          property: key,
          value: NativeAnimatedHelper.transformDataType(value)
        });
      }
    }), NativeAnimatedHelper.validateTransform(transConfigs), {
      type: "transform",
      transforms: transConfigs
    };
  }
}
var AnimatedTransform_default = AnimatedTransform;
export { AnimatedTransform, AnimatedTransform_default as default };
//# sourceMappingURL=AnimatedTransform.mjs.map
