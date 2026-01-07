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
var NativeAnimatedHelper_exports = {};
__export(NativeAnimatedHelper_exports, {
  API: () => API,
  NativeAnimatedHelper: () => NativeAnimatedHelper,
  addWhitelistedInterpolationParam: () => addWhitelistedInterpolationParam,
  addWhitelistedStyleProp: () => addWhitelistedStyleProp,
  addWhitelistedTransformProp: () => addWhitelistedTransformProp,
  assertNativeAnimatedModule: () => assertNativeAnimatedModule,
  default: () => NativeAnimatedHelper_default,
  generateNewAnimationId: () => generateNewAnimationId,
  generateNewNodeTag: () => generateNewNodeTag,
  isSupportedColorStyleProp: () => isSupportedColorStyleProp,
  isSupportedInterpolationParam: () => isSupportedInterpolationParam,
  isSupportedStyleProp: () => isSupportedStyleProp,
  isSupportedTransformProp: () => isSupportedTransformProp,
  shouldUseNativeDriver: () => shouldUseNativeDriver,
  transformDataType: () => transformDataType,
  validateInterpolation: () => validateInterpolation,
  validateStyles: () => validateStyles,
  validateTransform: () => validateTransform
});
module.exports = __toCommonJS(NativeAnimatedHelper_exports);
var import_NativeAnimatedModule = require("./NativeAnimatedModule.cjs"),
  import_NativeAnimatedTurboModule = require("./NativeAnimatedTurboModule.cjs"),
  import_NativeEventEmitter = require("../EventEmitter/NativeEventEmitter.cjs"),
  import_Platform = require("../Utilities/Platform.cjs"),
  import_ReactNativeFeatureFlags = require("../ReactNative/ReactNativeFeatureFlags.cjs"),
  import_react_native_web_internals = require("@tamagui/react-native-web-internals"),
  import_RCTDeviceEventEmitter = require("../EventEmitter/RCTDeviceEventEmitter.cjs");
const NativeAnimatedModule = import_Platform.Platform.OS === "ios" && global.RN$Bridgeless === !0 ? import_NativeAnimatedTurboModule.NativeAnimatedTurboModule : import_NativeAnimatedModule.NativeAnimatedNonTurboModule;
let __nativeAnimatedNodeTagCount = 1,
  __nativeAnimationIdCount = 1,
  nativeEventEmitter,
  waitingForQueuedOperations = /* @__PURE__ */new Set(),
  queueOperations = !1,
  queue = [],
  singleOpQueue = [];
const useSingleOpBatching = !1;
import_Platform.Platform.OS === "android" && NativeAnimatedModule?.queueAndExecuteBatchedOperations && import_ReactNativeFeatureFlags.ReactNativeFeatureFlags.animatedShouldUseSingleOp();
let flushQueueTimeout = null;
const eventListenerGetValueCallbacks = {},
  eventListenerAnimationFinishedCallbacks = {};
const nativeOps = useSingleOpBatching ? function () {
    return ["createAnimatedNode",
    // 1
    "updateAnimatedNodeConfig",
    // 2
    "getValue",
    // 3
    "startListeningToAnimatedNodeValue",
    // 4
    "stopListeningToAnimatedNodeValue",
    // 5
    "connectAnimatedNodes",
    // 6
    "disconnectAnimatedNodes",
    // 7
    "startAnimatingNode",
    // 8
    "stopAnimation",
    // 9
    "setAnimatedNodeValue",
    // 10
    "setAnimatedNodeOffset",
    // 11
    "flattenAnimatedNodeOffset",
    // 12
    "extractAnimatedNodeOffset",
    // 13
    "connectAnimatedNodeToView",
    // 14
    "disconnectAnimatedNodeFromView",
    // 15
    "restoreDefaultValues",
    // 16
    "dropAnimatedNode",
    // 17
    "addAnimatedEventToView",
    // 18
    "removeAnimatedEventFromView",
    // 19
    "addListener",
    // 20
    "removeListener"
    // 21
    ].reduce((acc, functionName, i) => (acc[functionName] = i + 1, acc), {});
  }() : NativeAnimatedModule,
  API = {
    getValue: function (tag, saveValueCallback) {
      (0, import_react_native_web_internals.invariant)(nativeOps, "Native animated module is not available"), useSingleOpBatching ? (saveValueCallback && (eventListenerGetValueCallbacks[tag] = saveValueCallback), API.queueOperation(nativeOps.getValue, tag)) : API.queueOperation(nativeOps.getValue, tag, saveValueCallback);
    },
    setWaitingForIdentifier: function (id) {
      waitingForQueuedOperations.add(id), queueOperations = !0, import_ReactNativeFeatureFlags.ReactNativeFeatureFlags.animatedShouldDebounceQueueFlush() && flushQueueTimeout && clearTimeout(flushQueueTimeout);
    },
    unsetWaitingForIdentifier: function (id) {
      waitingForQueuedOperations.delete(id), waitingForQueuedOperations.size === 0 && (queueOperations = !1, API.disableQueue());
    },
    disableQueue: function () {
      if ((0, import_react_native_web_internals.invariant)(nativeOps, "Native animated module is not available"), import_ReactNativeFeatureFlags.ReactNativeFeatureFlags.animatedShouldDebounceQueueFlush()) {
        const prevTimeout = flushQueueTimeout;
        clearImmediate(prevTimeout), flushQueueTimeout = setImmediate(API.flushQueue);
      } else API.flushQueue();
    },
    flushQueue: function () {},
    queueOperation: (fn, ...args) => {
      if (useSingleOpBatching) {
        singleOpQueue.push(fn, ...args);
        return;
      }
      queueOperations || queue.length !== 0 ? queue.push(() => fn(...args)) : fn(...args);
    },
    createAnimatedNode: function (tag, config) {
      (0, import_react_native_web_internals.invariant)(nativeOps, "Native animated module is not available"), API.queueOperation(nativeOps.createAnimatedNode, tag, config);
    },
    updateAnimatedNodeConfig: function (tag, config) {
      (0, import_react_native_web_internals.invariant)(nativeOps, "Native animated module is not available");
    },
    startListeningToAnimatedNodeValue: function (tag) {
      (0, import_react_native_web_internals.invariant)(nativeOps, "Native animated module is not available"), API.queueOperation(nativeOps.startListeningToAnimatedNodeValue, tag);
    },
    stopListeningToAnimatedNodeValue: function (tag) {
      (0, import_react_native_web_internals.invariant)(nativeOps, "Native animated module is not available"), API.queueOperation(nativeOps.stopListeningToAnimatedNodeValue, tag);
    },
    connectAnimatedNodes: function (parentTag, childTag) {
      (0, import_react_native_web_internals.invariant)(nativeOps, "Native animated module is not available"), API.queueOperation(nativeOps.connectAnimatedNodes, parentTag, childTag);
    },
    disconnectAnimatedNodes: function (parentTag, childTag) {
      (0, import_react_native_web_internals.invariant)(nativeOps, "Native animated module is not available"), API.queueOperation(nativeOps.disconnectAnimatedNodes, parentTag, childTag);
    },
    startAnimatingNode: function (animationId, nodeTag, config, endCallback) {
      (0, import_react_native_web_internals.invariant)(nativeOps, "Native animated module is not available"), useSingleOpBatching ? (endCallback && (eventListenerAnimationFinishedCallbacks[animationId] = endCallback), API.queueOperation(nativeOps.startAnimatingNode, animationId, nodeTag, config)) : API.queueOperation(nativeOps.startAnimatingNode, animationId, nodeTag, config, endCallback);
    },
    stopAnimation: function (animationId) {
      (0, import_react_native_web_internals.invariant)(nativeOps, "Native animated module is not available"), API.queueOperation(nativeOps.stopAnimation, animationId);
    },
    setAnimatedNodeValue: function (nodeTag, value) {
      (0, import_react_native_web_internals.invariant)(nativeOps, "Native animated module is not available"), API.queueOperation(nativeOps.setAnimatedNodeValue, nodeTag, value);
    },
    setAnimatedNodeOffset: function (nodeTag, offset) {
      (0, import_react_native_web_internals.invariant)(nativeOps, "Native animated module is not available"), API.queueOperation(nativeOps.setAnimatedNodeOffset, nodeTag, offset);
    },
    flattenAnimatedNodeOffset: function (nodeTag) {
      (0, import_react_native_web_internals.invariant)(nativeOps, "Native animated module is not available"), API.queueOperation(nativeOps.flattenAnimatedNodeOffset, nodeTag);
    },
    extractAnimatedNodeOffset: function (nodeTag) {
      (0, import_react_native_web_internals.invariant)(nativeOps, "Native animated module is not available"), API.queueOperation(nativeOps.extractAnimatedNodeOffset, nodeTag);
    },
    connectAnimatedNodeToView: function (nodeTag, viewTag) {
      (0, import_react_native_web_internals.invariant)(nativeOps, "Native animated module is not available"), API.queueOperation(nativeOps.connectAnimatedNodeToView, nodeTag, viewTag);
    },
    disconnectAnimatedNodeFromView: function (nodeTag, viewTag) {
      (0, import_react_native_web_internals.invariant)(nativeOps, "Native animated module is not available"), API.queueOperation(nativeOps.disconnectAnimatedNodeFromView, nodeTag, viewTag);
    },
    restoreDefaultValues: function (nodeTag) {
      (0, import_react_native_web_internals.invariant)(nativeOps, "Native animated module is not available"), nativeOps.restoreDefaultValues != null && API.queueOperation(nativeOps.restoreDefaultValues, nodeTag);
    },
    dropAnimatedNode: function (tag) {
      (0, import_react_native_web_internals.invariant)(nativeOps, "Native animated module is not available"), API.queueOperation(nativeOps.dropAnimatedNode, tag);
    },
    addAnimatedEventToView: function (viewTag, eventName, eventMapping) {
      (0, import_react_native_web_internals.invariant)(nativeOps, "Native animated module is not available"), API.queueOperation(nativeOps.addAnimatedEventToView, viewTag, eventName, eventMapping);
    },
    removeAnimatedEventFromView(viewTag, eventName, animatedNodeTag) {
      (0, import_react_native_web_internals.invariant)(nativeOps, "Native animated module is not available"), API.queueOperation(nativeOps.removeAnimatedEventFromView, viewTag, eventName, animatedNodeTag);
    }
  };
const SUPPORTED_COLOR_STYLES = {
    backgroundColor: !0,
    borderBottomColor: !0,
    borderColor: !0,
    borderEndColor: !0,
    borderLeftColor: !0,
    borderRightColor: !0,
    borderStartColor: !0,
    borderTopColor: !0,
    color: !0,
    tintColor: !0
  },
  SUPPORTED_STYLES = {
    ...SUPPORTED_COLOR_STYLES,
    borderBottomEndRadius: !0,
    borderBottomLeftRadius: !0,
    borderBottomRightRadius: !0,
    borderBottomStartRadius: !0,
    borderRadius: !0,
    borderTopEndRadius: !0,
    borderTopLeftRadius: !0,
    borderTopRightRadius: !0,
    borderTopStartRadius: !0,
    elevation: !0,
    opacity: !0,
    transform: !0,
    zIndex: !0,
    /* ios styles */
    shadowOpacity: !0,
    shadowRadius: !0,
    /* legacy android transform properties */
    scaleX: !0,
    scaleY: !0,
    translateX: !0,
    translateY: !0
  },
  SUPPORTED_TRANSFORMS = {
    translateX: !0,
    translateY: !0,
    scale: !0,
    scaleX: !0,
    scaleY: !0,
    rotate: !0,
    rotateX: !0,
    rotateY: !0,
    rotateZ: !0,
    perspective: !0
  },
  SUPPORTED_INTERPOLATION_PARAMS = {
    inputRange: !0,
    outputRange: !0,
    extrapolate: !0,
    extrapolateRight: !0,
    extrapolateLeft: !0
  };
function addWhitelistedStyleProp(prop) {
  SUPPORTED_STYLES[prop] = !0;
}
function addWhitelistedTransformProp(prop) {
  SUPPORTED_TRANSFORMS[prop] = !0;
}
function addWhitelistedInterpolationParam(param) {
  SUPPORTED_INTERPOLATION_PARAMS[param] = !0;
}
function isSupportedColorStyleProp(prop) {
  return SUPPORTED_COLOR_STYLES.hasOwnProperty(prop);
}
function isSupportedStyleProp(prop) {
  return SUPPORTED_STYLES.hasOwnProperty(prop);
}
function isSupportedTransformProp(prop) {
  return SUPPORTED_TRANSFORMS.hasOwnProperty(prop);
}
function isSupportedInterpolationParam(param) {
  return SUPPORTED_INTERPOLATION_PARAMS.hasOwnProperty(param);
}
function validateTransform(configs) {
  configs.forEach(config => {
    if (!isSupportedTransformProp(config.property)) throw new Error(`Property '${config.property}' is not supported by native animated module`);
  });
}
function validateStyles(styles) {
  for (const key in styles) if (!isSupportedStyleProp(key)) throw new Error(`Style property '${key}' is not supported by native animated module`);
}
function validateInterpolation(config) {
  for (const key in config) if (!isSupportedInterpolationParam(key)) throw new Error(`Interpolation property '${key}' is not supported by native animated module`);
}
function generateNewNodeTag() {
  return __nativeAnimatedNodeTagCount++;
}
function generateNewAnimationId() {
  return __nativeAnimationIdCount++;
}
function assertNativeAnimatedModule() {
  (0, import_react_native_web_internals.invariant)(NativeAnimatedModule, "Native animated module is not available");
}
let _warnedMissingNativeAnimated = !1;
function shouldUseNativeDriver(config) {
  return config.useNativeDriver == null && console.warn("Animated: `useNativeDriver` was not specified. This is a required option and must be explicitly set to `true` or `false`"), config.useNativeDriver === !0 && !NativeAnimatedModule ? (_warnedMissingNativeAnimated || (console.warn("Animated: `useNativeDriver` is not supported because the native animated module is missing. Falling back to JS-based animation. To resolve this, add `RCTAnimation` module to this app, or remove `useNativeDriver`. Make sure to run `bundle exec pod install` first. Read more about autolinking: https://github.com/react-native-community/cli/blob/master/docs/autolinking.md"), _warnedMissingNativeAnimated = !0), !1) : config.useNativeDriver || !1;
}
function transformDataType(value) {
  return typeof value != "string" ? value : /deg$/.test(value) ? (parseFloat(value) || 0) * Math.PI / 180 : value;
}
const NativeAnimatedHelper = {
  API,
  isSupportedColorStyleProp,
  isSupportedStyleProp,
  isSupportedTransformProp,
  isSupportedInterpolationParam,
  addWhitelistedStyleProp,
  addWhitelistedTransformProp,
  addWhitelistedInterpolationParam,
  validateStyles,
  validateTransform,
  validateInterpolation,
  generateNewNodeTag,
  generateNewAnimationId,
  assertNativeAnimatedModule,
  shouldUseNativeDriver,
  transformDataType,
  get nativeEventEmitter() {
    return nativeEventEmitter || (nativeEventEmitter = new import_NativeEventEmitter.NativeEventEmitter(
    // T88715063: NativeEventEmitter only used this parameter on iOS. Now it uses it on all platforms, so this code was modified automatically to preserve its behavior
    // If you want to use the native module on other platforms, please remove this condition and test its behavior
    import_Platform.Platform.OS !== "ios" ? null : NativeAnimatedModule)), nativeEventEmitter;
  }
};
var NativeAnimatedHelper_default = NativeAnimatedHelper;