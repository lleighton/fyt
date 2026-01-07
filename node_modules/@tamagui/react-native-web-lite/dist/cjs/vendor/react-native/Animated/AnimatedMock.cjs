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
var AnimatedMock_exports = {};
__export(AnimatedMock_exports, {
  AnimatedMock: () => AnimatedMockExports,
  AnimatedMockExports: () => AnimatedMockExports,
  default: () => AnimatedMock_default
});
module.exports = __toCommonJS(AnimatedMock_exports);
var import_AnimatedEvent = require("./AnimatedEvent.cjs"),
  import_AnimatedImplementation = require("./AnimatedImplementation.cjs"),
  import_AnimatedInterpolation = require("./nodes/AnimatedInterpolation.cjs"),
  import_AnimatedNode = require("./nodes/AnimatedNode.cjs"),
  import_AnimatedValue = require("./nodes/AnimatedValue.cjs"),
  import_AnimatedValueXY = require("./nodes/AnimatedValueXY.cjs"),
  import_createAnimatedComponent = require("./createAnimatedComponent.cjs"),
  import_AnimatedColor = require("./nodes/AnimatedColor.cjs");
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
    Value: import_AnimatedValue.AnimatedValue,
    ValueXY: import_AnimatedValueXY.AnimatedValueXY,
    Color: import_AnimatedColor.AnimatedColor,
    Interpolation: import_AnimatedInterpolation.AnimatedInterpolation,
    Node: import_AnimatedNode.AnimatedNode,
    decay,
    timing,
    spring,
    add: import_AnimatedImplementation.AnimatedImplementation.add,
    subtract: import_AnimatedImplementation.AnimatedImplementation.subtract,
    divide: import_AnimatedImplementation.AnimatedImplementation.divide,
    multiply: import_AnimatedImplementation.AnimatedImplementation.multiply,
    modulo: import_AnimatedImplementation.AnimatedImplementation.modulo,
    diffClamp: import_AnimatedImplementation.AnimatedImplementation.diffClamp,
    delay,
    sequence,
    parallel,
    stagger,
    loop,
    event: import_AnimatedImplementation.AnimatedImplementation.event,
    createAnimatedComponent: import_createAnimatedComponent.createAnimatedComponent,
    attachNativeEvent: import_AnimatedEvent.attachNativeEvent,
    forkEvent: import_AnimatedImplementation.AnimatedImplementation.forkEvent,
    unforkEvent: import_AnimatedImplementation.AnimatedImplementation.unforkEvent,
    Event: import_AnimatedEvent.AnimatedEvent
  };
var AnimatedMock_default = AnimatedMockExports;