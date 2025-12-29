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
var AnimatedEvent_exports = {};
__export(AnimatedEvent_exports, {
  AnimatedEvent: () => AnimatedEvent,
  attachNativeEvent: () => attachNativeEvent
});
module.exports = __toCommonJS(AnimatedEvent_exports);
var import_AnimatedValue = require("./nodes/AnimatedValue.cjs"),
  import_NativeAnimatedHelper = require("./NativeAnimatedHelper.cjs"),
  import_react_native_web_internals = require("@tamagui/react-native-web-internals"),
  import_NativeAnimatedHelper2 = require("./NativeAnimatedHelper.cjs");
const __DEV__ = process.env.NODE_ENV !== "production";
function attachNativeEvent(viewRef, eventName, argMapping) {
  const eventMappings = [],
    traverse = (value, path) => {
      if (value instanceof import_AnimatedValue.AnimatedValue) value.__makeNative(), eventMappings.push({
        nativeEventPath: path,
        animatedValueTag: value.__getNativeTag()
      });else if (typeof value == "object") for (const key in value) traverse(value[key], path.concat(key));
    };
  return (0, import_react_native_web_internals.invariant)(argMapping[0] && argMapping[0].nativeEvent, "Native driven events only support animated values contained inside `nativeEvent`."), traverse(argMapping[0].nativeEvent, []), viewRef != null && eventMappings.forEach(mapping => {
    import_NativeAnimatedHelper.NativeAnimatedHelper.API.addAnimatedEventToView(viewRef, eventName, mapping);
  }), {
    detach() {
      viewRef != null && eventMappings.forEach(mapping => {
        import_NativeAnimatedHelper.NativeAnimatedHelper.API.removeAnimatedEventFromView(viewRef, eventName, mapping.animatedValueTag);
      });
    }
  };
}
function validateMapping(argMapping, args) {
  const validate = (recMapping, recEvt, key) => {
    if (recMapping instanceof import_AnimatedValue.AnimatedValue) {
      (0, import_react_native_web_internals.invariant)(typeof recEvt == "number", "Bad mapping of event key " + key + ", should be number but got " + typeof recEvt);
      return;
    }
    if (typeof recEvt == "number") {
      (0, import_react_native_web_internals.invariant)(recMapping instanceof import_AnimatedValue.AnimatedValue, "Bad mapping of type " + typeof recMapping + " for key " + key + ", event value must map to AnimatedValue");
      return;
    }
    (0, import_react_native_web_internals.invariant)(typeof recMapping == "object", "Bad mapping of type " + typeof recMapping + " for key " + key), (0, import_react_native_web_internals.invariant)(typeof recEvt == "object", "Bad event of type " + typeof recEvt + " for key " + key);
    for (const mappingKey in recMapping) validate(recMapping[mappingKey], recEvt[mappingKey], mappingKey);
  };
  (0, import_react_native_web_internals.invariant)(args.length >= argMapping.length, "Event has less arguments than mapping"), argMapping.forEach((mapping, idx) => {
    validate(mapping, args[idx], "arg" + idx);
  });
}
class AnimatedEvent {
  _argMapping;
  _listeners = [];
  _attachedEvent;
  __isNative;
  constructor(argMapping, config) {
    this._argMapping = argMapping, config == null && (console.warn("Animated.event now requires a second argument for options"), config = {
      useNativeDriver: !1
    }), config.listener && this.__addListener(config.listener), this._callListeners = this._callListeners.bind(this), this._attachedEvent = null, this.__isNative = (0, import_NativeAnimatedHelper2.shouldUseNativeDriver)(config);
  }
  __addListener(callback) {
    this._listeners.push(callback);
  }
  __removeListener(callback) {
    this._listeners = this._listeners.filter(listener => listener !== callback);
  }
  __attach(viewRef, eventName) {
    (0, import_react_native_web_internals.invariant)(this.__isNative, "Only native driven events need to be attached."), this._attachedEvent = attachNativeEvent(viewRef, eventName, this._argMapping);
  }
  __detach(viewTag, eventName) {
    (0, import_react_native_web_internals.invariant)(this.__isNative, "Only native driven events need to be detached."), this._attachedEvent && this._attachedEvent.detach();
  }
  __getHandler() {
    if (this.__isNative) if (__DEV__) {
      let validatedMapping2 = !1;
      return (...args) => {
        validatedMapping2 || (validateMapping(this._argMapping, args), validatedMapping2 = !0), this._callListeners(...args);
      };
    } else return this._callListeners;
    let validatedMapping = !1;
    return (...args) => {
      __DEV__ && !validatedMapping && (validateMapping(this._argMapping, args), validatedMapping = !0);
      const traverse = (recMapping, recEvt, key) => {
        if (recMapping instanceof import_AnimatedValue.AnimatedValue) typeof recEvt == "number" && recMapping.setValue(recEvt);else if (typeof recMapping == "object") for (const mappingKey in recMapping) traverse(recMapping[mappingKey], recEvt[mappingKey], mappingKey);
      };
      this._argMapping.forEach((mapping, idx) => {
        traverse(mapping, args[idx], "arg" + idx);
      }), this._callListeners(...args);
    };
  }
  _callListeners(...args) {
    this._listeners.forEach(listener => listener(...args));
  }
}