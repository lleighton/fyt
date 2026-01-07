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
var RCTDeviceEventEmitter_exports = {};
__export(RCTDeviceEventEmitter_exports, {
  RCTDeviceEventEmitter: () => RCTDeviceEventEmitter,
  default: () => RCTDeviceEventEmitter_default
});
module.exports = __toCommonJS(RCTDeviceEventEmitter_exports);
var import_EventEmitter = require("../emitter/EventEmitter.cjs");
const RCTDeviceEventEmitter = new import_EventEmitter.EventEmitter();
var RCTDeviceEventEmitter_default = RCTDeviceEventEmitter;