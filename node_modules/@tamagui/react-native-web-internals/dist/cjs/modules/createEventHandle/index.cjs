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
var createEventHandle_exports = {};
__export(createEventHandle_exports, {
  createEventHandle: () => createEventHandle
});
module.exports = __toCommonJS(createEventHandle_exports);
var import_canUseDOM = require("../canUseDOM.cjs");
const emptyFunction = () => {};
function supportsPassiveEvents() {
  let supported = !1;
  if (import_canUseDOM.canUseDOM) try {
    const options = {};
    Object.defineProperty(options, "passive", {
      get() {
        return supported = !0, !1;
      }
    }), window.addEventListener("test", null, options), window.removeEventListener("test", null, options);
  } catch {}
  return supported;
}
const canUsePassiveEvents = supportsPassiveEvents();
function getOptions(options) {
  return options == null ? !1 : canUsePassiveEvents ? options : !!options.capture;
}
function isPropagationStopped() {
  return this.cancelBubble;
}
function isDefaultPrevented() {
  return this.defaultPrevented;
}
function normalizeEvent(event) {
  return event.nativeEvent = event, event.persist = emptyFunction, event.isDefaultPrevented = isDefaultPrevented, event.isPropagationStopped = isPropagationStopped, event;
}
function createEventHandle(type, options) {
  const opts = getOptions(options);
  return function (target, listener) {
    if (target == null || typeof target.addEventListener != "function") throw new Error("createEventHandle: called on an invalid target.");
    const element = target;
    if (listener != null) {
      const compatListener = e => listener(normalizeEvent(e));
      return element.addEventListener(type, compatListener, opts), function () {
        element?.removeEventListener(type, compatListener, opts);
      };
    } else return emptyFunction;
  };
}