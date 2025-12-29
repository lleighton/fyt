import { NativeAnimatedHelper } from "../NativeAnimatedHelper.mjs";
let startNativeAnimationNextId = 1;
class Animation {
  __active;
  __isInteraction;
  __nativeId;
  __onEnd;
  __iterations;
  start(fromValue, onUpdate, onEnd, previousAnimation, animatedValue) {}
  stop() {
    this.__nativeId && NativeAnimatedHelper.API.stopAnimation(this.__nativeId);
  }
  __getNativeAnimationConfig() {
    throw new Error("This animation type cannot be offloaded to native");
  }
  // Helper function for subclasses to make sure onEnd is only called once.
  __debouncedOnEnd(result) {
    const onEnd = this.__onEnd;
    this.__onEnd = null, onEnd && onEnd(result);
  }
  __startNativeAnimation(animatedValue) {
    const startNativeAnimationWaitId = `${startNativeAnimationNextId}:startAnimation`;
    startNativeAnimationNextId += 1, NativeAnimatedHelper.API.setWaitingForIdentifier(startNativeAnimationWaitId);
    try {
      const config = this.__getNativeAnimationConfig();
      animatedValue.__makeNative(config.platformConfig), this.__nativeId = NativeAnimatedHelper.generateNewAnimationId(), NativeAnimatedHelper.API.startAnimatingNode(this.__nativeId, animatedValue.__getNativeTag(), config,
      // $FlowFixMe[method-unbinding] added when improving typing for this parameters
      this.__debouncedOnEnd.bind(this));
    } catch (e) {
      throw e;
    } finally {
      NativeAnimatedHelper.API.unsetWaitingForIdentifier(startNativeAnimationWaitId);
    }
  }
}
var Animation_default = Animation;
export { Animation, Animation_default as default };
//# sourceMappingURL=Animation.mjs.map
