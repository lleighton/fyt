import { AnimatedProps } from "./nodes/AnimatedProps.mjs";
import { AnimatedEvent } from "./AnimatedEvent.mjs";
import { useRefEffect } from "../Utilities/useRefEffect.mjs";
import { NativeAnimatedHelper } from "./NativeAnimatedHelper.mjs";
import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { useLayoutEffect } from "@tamagui/react-native-web-internals";
function useAnimatedProps(props) {
  const [, scheduleUpdate] = useReducer(count => count + 1, 0),
    onUpdateRef = useRef(null),
    node = useMemo(() => new AnimatedProps(props, () => onUpdateRef.current?.()), [props]);
  useAnimatedPropsLifecycle(node);
  const refEffect = useCallback(instance => {
      node.setNativeView(instance), onUpdateRef.current = () => {
        scheduleUpdate();
      };
      const target = getEventTarget(instance),
        events = [];
      for (const propName in props) {
        const propValue = props[propName];
        propValue instanceof AnimatedEvent && propValue.__isNative && (propValue.__attach(target, propName), events.push([propName, propValue]));
      }
      return () => {
        onUpdateRef.current = null;
        for (const [propName, propValue] of events) propValue.__detach(target, propName);
      };
    }, [props, node]),
    callbackRef = useRefEffect(refEffect);
  return [reduceAnimatedProps(node), callbackRef];
}
function reduceAnimatedProps(node) {
  return {
    ...node.__getValue(),
    collapsable: !1
  };
}
function useAnimatedPropsLifecycle(node) {
  const prevNodeRef = useRef(null),
    isUnmountingRef = useRef(!1);
  useEffect(() => {
    NativeAnimatedHelper.API.flushQueue();
  }), useLayoutEffect(() => (isUnmountingRef.current = !1, () => {
    isUnmountingRef.current = !0;
  }), []), useLayoutEffect(() => {
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
export { useAnimatedProps_default as default, useAnimatedProps };
//# sourceMappingURL=useAnimatedProps.mjs.map
