import { AnimatedEvent, attachNativeEvent } from "./AnimatedEvent.mjs";
import { AnimatedImplementation } from "./AnimatedImplementation.mjs";
import { AnimatedInterpolation } from "./nodes/AnimatedInterpolation.mjs";
import { AnimatedNode } from "./nodes/AnimatedNode.mjs";
import { AnimatedValue } from "./nodes/AnimatedValue.mjs";
import { AnimatedValueXY } from "./nodes/AnimatedValueXY.mjs";
import { createAnimatedComponent } from "./createAnimatedComponent.mjs";
import { AnimatedColor } from "./nodes/AnimatedColor.mjs";
let inAnimationCallback = !1;
function mockAnimationStart(start) {
  return callback => {
    const guardedCallback = callback == null ? callback : (...args) => {
      if (inAnimationCallback) {
        console.warn("Ignoring recursive animation callback when running mock animations");
        return;
      }
      inAnimationCallback = !0;
      try {
        callback(...args);
      } finally {
        inAnimationCallback = !1;
      }
    };
    start(guardedCallback);
  };
}
const emptyAnimation = {
    start: () => {},
    stop: () => {},
    reset: () => {},
    _startNativeLoop: () => {},
    _isUsingNativeDriver: () => !1
  },
  mockCompositeAnimation = animations => ({
    ...emptyAnimation,
    start: mockAnimationStart(callback => {
      animations.forEach(animation => animation.start()), callback?.({
        finished: !0
      });
    })
  }),
  spring = function (value, config) {
    const anyValue = value;
    return {
      ...emptyAnimation,
      start: mockAnimationStart(callback => {
        anyValue.setValue(config.toValue), callback?.({
          finished: !0
        });
      })
    };
  },
  timing = function (value, config) {
    const anyValue = value;
    return {
      ...emptyAnimation,
      start: mockAnimationStart(callback => {
        anyValue.setValue(config.toValue), callback?.({
          finished: !0
        });
      })
    };
  },
  decay = function (value, config) {
    return emptyAnimation;
  },
  sequence = function (animations) {
    return mockCompositeAnimation(animations);
  },
  parallel = function (animations, config) {
    return mockCompositeAnimation(animations);
  },
  delay = function (time) {
    return emptyAnimation;
  },
  stagger = function (time, animations) {
    return mockCompositeAnimation(animations);
  },
  loop = function (animation, {
    iterations = -1
  } = {}) {
    return emptyAnimation;
  },
  AnimatedMockExports = {
    Value: AnimatedValue,
    ValueXY: AnimatedValueXY,
    Color: AnimatedColor,
    Interpolation: AnimatedInterpolation,
    Node: AnimatedNode,
    decay,
    timing,
    spring,
    add: AnimatedImplementation.add,
    subtract: AnimatedImplementation.subtract,
    divide: AnimatedImplementation.divide,
    multiply: AnimatedImplementation.multiply,
    modulo: AnimatedImplementation.modulo,
    diffClamp: AnimatedImplementation.diffClamp,
    delay,
    sequence,
    parallel,
    stagger,
    loop,
    event: AnimatedImplementation.event,
    createAnimatedComponent,
    attachNativeEvent,
    forkEvent: AnimatedImplementation.forkEvent,
    unforkEvent: AnimatedImplementation.unforkEvent,
    Event: AnimatedEvent
  };
var AnimatedMock_default = AnimatedMockExports;
export { AnimatedMockExports as AnimatedMock, AnimatedMockExports, AnimatedMock_default as default };
//# sourceMappingURL=AnimatedMock.mjs.map
