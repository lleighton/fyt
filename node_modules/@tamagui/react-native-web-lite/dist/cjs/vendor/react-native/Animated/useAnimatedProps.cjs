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
var useAnimatedProps_exports = {};
__export(useAnimatedProps_exports, {
  default: () => useAnimatedProps_default,
  useAnimatedProps: () => useAnimatedProps
});
module.exports = __toCommonJS(useAnimatedProps_exports);
var import_AnimatedProps = require("./nodes/AnimatedProps.cjs"),
  import_AnimatedEvent = require("./AnimatedEvent.cjs"),
  import_useRefEffect = require("../Utilities/useRefEffect.cjs"),
  import_NativeAnimatedHelper = require("./NativeAnimatedHelper.cjs"),
  import_react = require("react"),
  import_react_native_web_internals = require("@tamagui/react-native-web-internals");
function useAnimatedProps(props) {
  const [, scheduleUpdate] = (0, import_react.useReducer)(count => count + 1, 0),
    onUpdateRef = (0, import_react.useRef)(null),
    node = (0, import_react.useMemo)(() => new import_AnimatedProps.AnimatedProps(props, () => onUpdateRef.current?.()), [props]);
  useAnimatedPropsLifecycle(node);
  const refEffect = (0, import_react.useCallback)(instance => {
      node.setNativeView(instance), onUpdateRef.current = () => {
        scheduleUpdate();
      };
      const target = getEventTarget(instance),
        events = [];
      for (const propName in props) {
        const propValue = props[propName];
        propValue instanceof import_AnimatedEvent.AnimatedEvent && propValue.__isNative && (propValue.__attach(target, propName), events.push([propName, propValue]));
      }
      return () => {
        onUpdateRef.current = null;
        for (const [propName, propValue] of events) propValue.__detach(target, propName);
      };
    }, [props, node]),
    callbackRef = (0, import_useRefEffect.useRefEffect)(refEffect);
  return [reduceAnimatedProps(node), callbackRef];
}
function reduceAnimatedProps(node) {
  return {
    ...node.__getValue(),
    collapsable: !1
  };
}
function useAnimatedPropsLifecycle(node) {
  const prevNodeRef = (0, import_react.useRef)(null),
    isUnmountingRef = (0, import_react.useRef)(!1);
  (0, import_react.useEffect)(() => {
    import_NativeAnimatedHelper.NativeAnimatedHelper.API.flushQueue();
  }), (0, import_react_native_web_internals.useLayoutEffect)(() => (isUnmountingRef.current = !1, () => {
    isUnmountingRef.current = !0;
  }), []), (0, import_react_native_web_internals.useLayoutEffect)(() => {
    if (node.__attach(), prevNodeRef.current != null) {
      const prevNode = prevNodeRef.current;
      prevNode.__restoreDefaultValues(), prevNode.__detach(), prevNodeRef.current = null;
    }
    return () => {
      isUnmountingRef.current ? node.__detach() : prevNodeRef.current = node;
    };
  }, [node]);
}
function getEventTarget(instance) {
  return typeof instance == "object" && typeof instance?.getScrollableNode == "function" ? instance.getScrollableNode() : instance;
}
var useAnimatedProps_default = useAnimatedProps;