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
var CoreEventTypes_exports = {};
__export(CoreEventTypes_exports, {
  NativeKeyboardEvent: () => NativeKeyboardEvent,
  NativeMouseEvent: () => NativeMouseEvent,
  NativePointerEvent: () => NativePointerEvent,
  NativeTouchEvent: () => NativeTouchEvent,
  NativeUIEvent: () => NativeUIEvent,
  ScrollEvent: () => ScrollEvent
});
module.exports = __toCommonJS(CoreEventTypes_exports);
const SyntheticEvent = {
    bubbles: null,
    cancelable: null,
    currentTarget: null,
    defaultPrevented: null,
    dispatchConfig: null,
    eventPhase: null,
    preventDefault: () => {},
    isDefaultPrevented: () => !1,
    stopPropagation: () => {},
    isPropagationStopped: () => !1,
    isTrusted: null,
    nativeEvent: null,
    persist: () => {},
    target: null,
    timeStamp: 0,
    type: null
  },
  ResponderSyntheticEvent = {
    ...SyntheticEvent,
    touchHistory: null
  },
  Layout = {
    x: 0,
    y: 0,
    width: 0,
    height: 0
  },
  TextLayout = {
    ...Layout,
    ascender: 0,
    capHeight: 0,
    descender: 0,
    text: "",
    xHeight: 0
  };
const NativeUIEvent = {
    detail: 0
  },
  NativeMouseEvent = {
    screenX: 0,
    screenY: 0,
    pageX: 0,
    pageY: 0,
    clientX: 0,
    clientY: 0,
    x: 0,
    y: 0,
    ctrlKey: !1,
    shiftKey: !1,
    altKey: !1,
    metaKey: !1,
    button: 0,
    buttons: 0,
    relatedTarget: null,
    offsetX: 0,
    offsetY: 0
  },
  NativePointerEvent = {
    ...NativeMouseEvent,
    pointerId: 0,
    width: 0,
    height: 0,
    pressure: 0,
    tangentialPressure: 0,
    tiltX: 0,
    tiltY: 0,
    twist: 0,
    pointerType: "",
    isPrimary: !1
  },
  NativeTouchEvent = {
    changedTouches: [],
    identifier: 0,
    locationX: 0,
    locationY: 0,
    pageX: 0,
    pageY: 0,
    target: null,
    timestamp: 0,
    touches: []
  },
  NativeKeyboardEvent = {
    key: "",
    code: "",
    ctrlKey: !1,
    shiftKey: !1,
    altKey: !1,
    metaKey: !1,
    repeat: !1,
    location: 0,
    keyCode: 0,
    charCode: 0,
    which: 0
  },
  ScrollEvent = {
    ...SyntheticEvent,
    contentInset: {
      top: 0,
      left: 0,
      bottom: 0,
      right: 0
    },
    contentOffset: {
      x: 0,
      y: 0
    },
    contentSize: {
      width: 0,
      height: 0
    },
    layoutMeasurement: {
      width: 0,
      height: 0
    },
    velocity: {
      x: 0,
      y: 0
    },
    zoomScale: 1,
    responderIgnoreScroll: !1,
    target: null,
    responder: null
  };