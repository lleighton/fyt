import "./AnimatedValue.mjs";
import { AnimatedNode } from "./AnimatedNode.mjs";
import { generateNewAnimationId, shouldUseNativeDriver } from "../NativeAnimatedHelper.mjs";
class AnimatedTracking extends AnimatedNode {
  _value;
  _parent;
  _callback;
  _animationConfig;
  _animationClass;
  _useNativeDriver;
  constructor(value, parent, animationClass, animationConfig, callback) {
    super(), this._value = value, this._parent = parent, this._animationClass = animationClass, this._animationConfig = animationConfig, this._useNativeDriver = shouldUseNativeDriver(animationConfig), this._callback = callback, this.__attach();
  }
  __makeNative() {
    this.__isNative = !0, this._parent.__makeNative(), super.__makeNative(), this._value.__makeNative();
  }
  __getValue() {
    return this._parent.__getValue();
  }
  __attach() {
    this._parent.__addChild(this), this._useNativeDriver && this.__makeNative();
  }
  __detach() {
    this._parent.__removeChild(this), super.__detach();
  }
  update() {
    this._value.animate(new this._animationClass({
      ...this._animationConfig,
      toValue: this._animationConfig.toValue.__getValue()
    }), this._callback);
  }
  __getNativeConfig() {
    const animationConfig = new this._animationClass({
      ...this._animationConfig,
      // remove toValue from the config as it's a ref to Animated.Value
      toValue: void 0
    }).__getNativeAnimationConfig();
    return {
      type: "tracking",
      animationId: generateNewAnimationId(),
      animationConfig,
      toValue: this._parent.__getNativeTag(),
      value: this._value.__getNativeTag()
    };
  }
}
var AnimatedTracking_default = AnimatedTracking;
export { AnimatedTracking, AnimatedTracking_default as default };
//# sourceMappingURL=AnimatedTracking.mjs.map
