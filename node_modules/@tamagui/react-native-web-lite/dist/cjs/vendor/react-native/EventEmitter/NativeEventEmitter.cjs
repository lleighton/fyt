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
var NativeEventEmitter_exports = {};
__export(NativeEventEmitter_exports, {
  NativeEventEmitter: () => NativeEventEmitter,
  default: () => NativeEventEmitter_default
});
module.exports = __toCommonJS(NativeEventEmitter_exports);
var import_react_native_web_internals = require("@tamagui/react-native-web-internals"),
  import_RCTDeviceEventEmitter = require("./RCTDeviceEventEmitter.cjs");
class NativeEventEmitter {
  _nativeModule;
  constructor(nativeModule) {
    import_react_native_web_internals.Platform.OS === "ios" && ((0, import_react_native_web_internals.invariant)(nativeModule != null, "`new NativeEventEmitter()` requires a non-null argument."), this._nativeModule = nativeModule);
  }
  addListener(eventType, listener, context) {
    this._nativeModule?.addListener(eventType);
    let subscription = import_RCTDeviceEventEmitter.RCTDeviceEventEmitter.addListener(eventType, listener, context);
    return {
      remove: () => {
        subscription != null && (this._nativeModule?.removeListeners(1), subscription.remove(), subscription = null);
      }
    };
  }
  /**
   * @deprecated Use `remove` on the EventSubscription from `addListener`.
   */
  removeListener(eventType, listener) {
    this._nativeModule?.removeListeners(1), import_RCTDeviceEventEmitter.RCTDeviceEventEmitter.removeListener(eventType, listener);
  }
  emit(eventType, ...args) {
    import_RCTDeviceEventEmitter.RCTDeviceEventEmitter.emit(eventType, ...args);
  }
  removeAllListeners(eventType) {
    (0, import_react_native_web_internals.invariant)(eventType != null, "`NativeEventEmitter.removeAllListener()` requires a non-null argument."), this._nativeModule?.removeListeners(this.listenerCount(eventType)), import_RCTDeviceEventEmitter.RCTDeviceEventEmitter.removeAllListeners(eventType);
  }
  listenerCount(eventType) {
    return import_RCTDeviceEventEmitter.RCTDeviceEventEmitter.listenerCount(eventType);
  }
}
var NativeEventEmitter_default = NativeEventEmitter;