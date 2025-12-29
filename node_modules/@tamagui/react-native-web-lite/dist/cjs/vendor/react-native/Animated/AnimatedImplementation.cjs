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
var AnimatedImplementation_exports = {};
__export(AnimatedImplementation_exports, {
  AnimatedImplementation: () => AnimatedImplementationExports,
  AnimatedImplementationExports: () => AnimatedImplementationExports,
  default: () => AnimatedImplementation_default
});
module.exports = __toCommonJS(AnimatedImplementation_exports);
var import_AnimatedEvent = require("./AnimatedEvent.cjs"),
  import_AnimatedAddition = require("./nodes/AnimatedAddition.cjs"),
  import_AnimatedDiffClamp = require("./nodes/AnimatedDiffClamp.cjs"),
  import_AnimatedDivision = require("./nodes/AnimatedDivision.cjs"),
  import_AnimatedInterpolation = require("./nodes/AnimatedInterpolation.cjs"),
  import_AnimatedModulo = require("./nodes/AnimatedModulo.cjs"),
  import_AnimatedMultiplication = require("./nodes/AnimatedMultiplication.cjs"),
  import_AnimatedNode = require("./nodes/AnimatedNode.cjs"),
  import_AnimatedProps = require("./nodes/AnimatedProps.cjs"),
  import_AnimatedSubtraction = require("./nodes/AnimatedSubtraction.cjs"),
  import_AnimatedTracking = require("./nodes/AnimatedTracking.cjs"),
  import_AnimatedValue = require("./nodes/AnimatedValue.cjs"),
  import_AnimatedValueXY = require("./nodes/AnimatedValueXY.cjs"),
  import_DecayAnimation = require("./animations/DecayAnimation.cjs"),
  import_SpringAnimation = require("./animations/SpringAnimation.cjs"),
  import_TimingAnimation = require("./animations/TimingAnimation.cjs"),
  import_createAnimatedComponent = require("./createAnimatedComponent.cjs"),
  import_Animation = require("./animations/Animation.cjs"),
  import_AnimatedColor = require("./nodes/AnimatedColor.cjs");
const add = function (a, b) {
    return new import_AnimatedAddition.AnimatedAddition(a, b);
  },
  subtract = function (a, b) {
    return new import_AnimatedSubtraction.AnimatedSubtraction(a, b);
  },
  divide = function (a, b) {
    return new import_AnimatedDivision.AnimatedDivision(a, b);
  },
  multiply = function (a, b) {
    return new import_AnimatedMultiplication.AnimatedMultiplication(a, b);
  },
  modulo = function (a, modulus) {
    return new import_AnimatedModulo.AnimatedModulo(a, modulus);
  },
  diffClamp = function (a, min, max) {
    return new import_AnimatedDiffClamp.AnimatedDiffClamp(a, min, max);
  },
  _combineCallbacks = function (callback, config) {
    return callback && config.onComplete ? (...args) => {
      config.onComplete && config.onComplete(...args), callback && callback(...args);
    } : callback || config.onComplete;
  },
  maybeVectorAnim = function (value, config, anim) {
    if (value instanceof import_AnimatedValueXY.AnimatedValueXY) {
      const configX = {
          ...config
        },
        configY = {
          ...config
        };
      for (const key in config) {
        const {
          x,
          y
        } = config[key];
        x !== void 0 && y !== void 0 && (configX[key] = x, configY[key] = y);
      }
      const aX = anim(value.x, configX),
        aY = anim(value.y, configY);
      return parallel([aX, aY], {
        stopTogether: !1
      });
    } else if (value instanceof import_AnimatedColor.AnimatedColor) {
      const configR = {
          ...config
        },
        configG = {
          ...config
        },
        configB = {
          ...config
        },
        configA = {
          ...config
        };
      for (const key in config) {
        const {
          r,
          g,
          b,
          a
        } = config[key];
        r !== void 0 && g !== void 0 && b !== void 0 && a !== void 0 && (configR[key] = r, configG[key] = g, configB[key] = b, configA[key] = a);
      }
      const aR = anim(value.r, configR),
        aG = anim(value.g, configG),
        aB = anim(value.b, configB),
        aA = anim(value.a, configA);
      return parallel([aR, aG, aB, aA], {
        stopTogether: !1
      });
    }
    return null;
  },
  spring = function (value, config) {
    const start = function (animatedValue, configuration, callback) {
      callback = _combineCallbacks(callback, configuration);
      const singleValue = animatedValue,
        singleConfig = configuration;
      singleValue.stopTracking(), configuration.toValue instanceof import_AnimatedNode.AnimatedNode ? singleValue.track(new import_AnimatedTracking.AnimatedTracking(singleValue, configuration.toValue, import_SpringAnimation.SpringAnimation, singleConfig, callback)) : singleValue.animate(new import_SpringAnimation.SpringAnimation(singleConfig), callback);
    };
    return maybeVectorAnim(value, config, spring) || {
      start: function (callback) {
        start(value, config, callback);
      },
      stop: function () {
        value.stopAnimation();
      },
      reset: function () {
        value.resetAnimation();
      },
      _startNativeLoop: function (iterations) {
        const singleConfig = {
          ...config,
          iterations
        };
        start(value, singleConfig);
      },
      _isUsingNativeDriver: function () {
        return config.useNativeDriver || !1;
      }
    };
  },
  timing = function (value, config) {
    const start = function (animatedValue, configuration, callback) {
      callback = _combineCallbacks(callback, configuration);
      const singleValue = animatedValue,
        singleConfig = configuration;
      singleValue.stopTracking(), configuration.toValue instanceof import_AnimatedNode.AnimatedNode ? singleValue.track(new import_AnimatedTracking.AnimatedTracking(singleValue, configuration.toValue, import_TimingAnimation.TimingAnimation, singleConfig, callback)) : singleValue.animate(new import_TimingAnimation.TimingAnimation(singleConfig), callback);
    };
    return maybeVectorAnim(value, config, timing) || {
      start: function (callback) {
        start(value, config, callback);
      },
      stop: function () {
        value.stopAnimation();
      },
      reset: function () {
        value.resetAnimation();
      },
      _startNativeLoop: function (iterations) {
        const singleConfig = {
          ...config,
          iterations
        };
        start(value, singleConfig);
      },
      _isUsingNativeDriver: function () {
        return config.useNativeDriver || !1;
      }
    };
  },
  decay = function (value, config) {
    const start = function (animatedValue, configuration, callback) {
      callback = _combineCallbacks(callback, configuration);
      const singleValue = animatedValue,
        singleConfig = configuration;
      singleValue.stopTracking(), singleValue.animate(new import_DecayAnimation.DecayAnimation(singleConfig), callback);
    };
    return maybeVectorAnim(value, config, decay) || {
      start: function (callback) {
        start(value, config, callback);
      },
      stop: function () {
        value.stopAnimation();
      },
      reset: function () {
        value.resetAnimation();
      },
      _startNativeLoop: function (iterations) {
        const singleConfig = {
          ...config,
          iterations
        };
        start(value, singleConfig);
      },
      _isUsingNativeDriver: function () {
        return config.useNativeDriver || !1;
      }
    };
  },
  sequence = function (animations) {
    let current = 0;
    return {
      start: function (callback) {
        const onComplete = function (result) {
          if (!result.finished) {
            callback && callback(result);
            return;
          }
          if (current++, current === animations.length) {
            callback && callback(result);
            return;
          }
          animations[current].start(onComplete);
        };
        animations.length === 0 ? callback && callback({
          finished: !0
        }) : animations[current].start(onComplete);
      },
      stop: function () {
        current < animations.length && animations[current].stop();
      },
      reset: function () {
        animations.forEach((animation, idx) => {
          idx <= current && animation.reset();
        }), current = 0;
      },
      _startNativeLoop: function () {
        throw new Error("Loops run using the native driver cannot contain Animated.sequence animations");
      },
      _isUsingNativeDriver: function () {
        return !1;
      }
    };
  },
  parallel = function (animations, config) {
    let doneCount = 0;
    const hasEnded = {},
      stopTogether = !(config && config.stopTogether === !1),
      result = {
        start: function (callback) {
          if (doneCount === animations.length) {
            callback && callback({
              finished: !0
            });
            return;
          }
          animations.forEach((animation, idx) => {
            const cb = function (endResult) {
              if (hasEnded[idx] = !0, doneCount++, doneCount === animations.length) {
                doneCount = 0, callback && callback(endResult);
                return;
              }
              !endResult.finished && stopTogether && result.stop();
            };
            animation ? animation.start(cb) : cb({
              finished: !0
            });
          });
        },
        stop: function () {
          animations.forEach((animation, idx) => {
            !hasEnded[idx] && animation.stop(), hasEnded[idx] = !0;
          });
        },
        reset: function () {
          animations.forEach((animation, idx) => {
            animation.reset(), hasEnded[idx] = !1, doneCount = 0;
          });
        },
        _startNativeLoop: function () {
          throw new Error("Loops run using the native driver cannot contain Animated.parallel animations");
        },
        _isUsingNativeDriver: function () {
          return !1;
        }
      };
    return result;
  },
  delay = function (time) {
    return timing(new import_AnimatedValue.AnimatedValue(0), {
      toValue: 0,
      delay: time,
      duration: 0,
      useNativeDriver: !1
    });
  },
  stagger = function (time, animations) {
    return parallel(animations.map((animation, i) => sequence([delay(time * i), animation])));
  },
  loop = function (animation, {
    iterations = -1,
    resetBeforeIteration = !0
  } = {}) {
    let isFinished = !1,
      iterationsSoFar = 0;
    return {
      start: function (callback) {
        const restart = function (result = {
          finished: !0
        }) {
          isFinished || iterationsSoFar === iterations || result.finished === !1 ? callback && callback(result) : (iterationsSoFar++, resetBeforeIteration && animation.reset(), animation.start(restart));
        };
        !animation || iterations === 0 ? callback && callback({
          finished: !0
        }) : animation._isUsingNativeDriver() ? animation._startNativeLoop(iterations) : restart();
      },
      stop: function () {
        isFinished = !0, animation.stop();
      },
      reset: function () {
        iterationsSoFar = 0, isFinished = !1, animation.reset();
      },
      _startNativeLoop: function () {
        throw new Error("Loops run using the native driver cannot contain Animated.loop animations");
      },
      _isUsingNativeDriver: function () {
        return animation._isUsingNativeDriver();
      }
    };
  };
function forkEvent(event2, listener) {
  return event2 ? event2 instanceof import_AnimatedEvent.AnimatedEvent ? (event2.__addListener(listener), event2) : (...args) => {
    typeof event2 == "function" && event2(...args), listener(...args);
  } : listener;
}
function unforkEvent(event2, listener) {
  event2 && event2 instanceof import_AnimatedEvent.AnimatedEvent && event2.__removeListener(listener);
}
const event = function (argMapping, config) {
    const animatedEvent = new import_AnimatedEvent.AnimatedEvent(argMapping, config);
    return animatedEvent.__isNative ? animatedEvent : animatedEvent.__getHandler();
  },
  AnimatedImplementationExports = {
    /**
     * Standard value class for driving animations.  Typically initialized with
     * `new Animated.Value(0);`
     *
     * See https://reactnative.dev/docs/animated#value
     */
    Value: import_AnimatedValue.AnimatedValue,
    /**
     * 2D value class for driving 2D animations, such as pan gestures.
     *
     * See https://reactnative.dev/docs/animatedvaluexy
     */
    ValueXY: import_AnimatedValueXY.AnimatedValueXY,
    /**
     * Value class for driving color animations.
     */
    Color: import_AnimatedColor.AnimatedColor,
    /**
     * Exported to use the Interpolation type in flow.
     *
     * See https://reactnative.dev/docs/animated#interpolation
     */
    Interpolation: import_AnimatedInterpolation.AnimatedInterpolation,
    /**
     * Exported for ease of type checking. All animated values derive from this
     * class.
     *
     * See https://reactnative.dev/docs/animated#node
     */
    Node: import_AnimatedNode.AnimatedNode,
    /**
     * Animates a value from an initial velocity to zero based on a decay
     * coefficient.
     *
     * See https://reactnative.dev/docs/animated#decay
     */
    decay,
    /**
     * Animates a value along a timed easing curve. The Easing module has tons of
     * predefined curves, or you can use your own function.
     *
     * See https://reactnative.dev/docs/animated#timing
     */
    timing,
    /**
     * Animates a value according to an analytical spring model based on
     * damped harmonic oscillation.
     *
     * See https://reactnative.dev/docs/animated#spring
     */
    spring,
    /**
     * Creates a new Animated value composed from two Animated values added
     * together.
     *
     * See https://reactnative.dev/docs/animated#add
     */
    add,
    /**
     * Creates a new Animated value composed by subtracting the second Animated
     * value from the first Animated value.
     *
     * See https://reactnative.dev/docs/animated#subtract
     */
    subtract,
    /**
     * Creates a new Animated value composed by dividing the first Animated value
     * by the second Animated value.
     *
     * See https://reactnative.dev/docs/animated#divide
     */
    divide,
    /**
     * Creates a new Animated value composed from two Animated values multiplied
     * together.
     *
     * See https://reactnative.dev/docs/animated#multiply
     */
    multiply,
    /**
     * Creates a new Animated value that is the (non-negative) modulo of the
     * provided Animated value.
     *
     * See https://reactnative.dev/docs/animated#modulo
     */
    modulo,
    /**
     * Create a new Animated value that is limited between 2 values. It uses the
     * difference between the last value so even if the value is far from the
     * bounds it will start changing when the value starts getting closer again.
     *
     * See https://reactnative.dev/docs/animated#diffclamp
     */
    diffClamp,
    /**
     * Starts an animation after the given delay.
     *
     * See https://reactnative.dev/docs/animated#delay
     */
    delay,
    /**
     * Starts an array of animations in order, waiting for each to complete
     * before starting the next. If the current running animation is stopped, no
     * following animations will be started.
     *
     * See https://reactnative.dev/docs/animated#sequence
     */
    sequence,
    /**
     * Starts an array of animations all at the same time. By default, if one
     * of the animations is stopped, they will all be stopped. You can override
     * this with the `stopTogether` flag.
     *
     * See https://reactnative.dev/docs/animated#parallel
     */
    parallel,
    /**
     * Array of animations may run in parallel (overlap), but are started in
     * sequence with successive delays.  Nice for doing trailing effects.
     *
     * See https://reactnative.dev/docs/animated#stagger
     */
    stagger,
    /**
     * Loops a given animation continuously, so that each time it reaches the
     * end, it resets and begins again from the start.
     *
     * See https://reactnative.dev/docs/animated#loop
     */
    loop,
    /**
     * Takes an array of mappings and extracts values from each arg accordingly,
     * then calls `setValue` on the mapped outputs.
     *
     * See https://reactnative.dev/docs/animated#event
     */
    event,
    /**
     * Make any React component Animatable.  Used to create `Animated.View`, etc.
     *
     * See https://reactnative.dev/docs/animated#createanimatedcomponent
     */
    createAnimatedComponent: import_createAnimatedComponent.createAnimatedComponent,
    /**
     * Imperative API to attach an animated value to an event on a view. Prefer
     * using `Animated.event` with `useNativeDrive: true` if possible.
     *
     * See https://reactnative.dev/docs/animated#attachnativeevent
     */
    attachNativeEvent: import_AnimatedEvent.attachNativeEvent,
    /**
     * Advanced imperative API for snooping on animated events that are passed in
     * through props. Use values directly where possible.
     *
     * See https://reactnative.dev/docs/animated#forkevent
     */
    forkEvent,
    unforkEvent,
    /**
     * Expose Event class, so it can be used as a type for type checkers.
     */
    Event: import_AnimatedEvent.AnimatedEvent
  };
var AnimatedImplementation_default = AnimatedImplementationExports;