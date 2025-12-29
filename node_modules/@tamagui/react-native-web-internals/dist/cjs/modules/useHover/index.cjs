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
var useHover_exports = {};
__export(useHover_exports, {
  useHover: () => useHover
});
module.exports = __toCommonJS(useHover_exports);
var import_modality = require("../modality/index.cjs"),
  import_useEvent = require("../useEvent/index.cjs"),
  import_useLayoutEffect = require("../useLayoutEffect/index.cjs");
const emptyObject = {},
  opts = {
    passive: !0
  },
  lockEventType = "react-gui:hover:lock",
  unlockEventType = "react-gui:hover:unlock",
  supportsPointerEvent = () => typeof window < "u" && window.PointerEvent != null;
function dispatchCustomEvent(target, type, payload) {
  const event = document.createEvent("CustomEvent"),
    {
      bubbles = !0,
      cancelable = !0,
      detail
    } = payload || emptyObject;
  event.initCustomEvent(type, bubbles, cancelable, detail), target.dispatchEvent(event);
}
function getPointerType(event) {
  const {
    pointerType
  } = event;
  return pointerType ?? (0, import_modality.getModality)();
}
function useHover(targetRef, config) {
  const {
      contain,
      disabled,
      onHoverStart,
      onHoverChange,
      onHoverUpdate,
      onHoverEnd
    } = config,
    canUsePE = supportsPointerEvent(),
    addMoveListener = (0, import_useEvent.useEvent)(canUsePE ? "pointermove" : "mousemove", opts),
    addEnterListener = (0, import_useEvent.useEvent)(canUsePE ? "pointerenter" : "mouseenter", opts),
    addLeaveListener = (0, import_useEvent.useEvent)(canUsePE ? "pointerleave" : "mouseleave", opts),
    addLockListener = (0, import_useEvent.useEvent)(lockEventType, opts),
    addUnlockListener = (0, import_useEvent.useEvent)(unlockEventType, opts);
  (0, import_useLayoutEffect.useLayoutEffectImpl)(() => {
    const target = targetRef.current;
    if (target !== null) {
      const hoverEnd = function (e) {
          onHoverEnd?.(e), onHoverChange?.(!1), addMoveListener(target, null), addLeaveListener(target, null);
        },
        leaveListener = function (e) {
          const target2 = targetRef.current;
          target2 != null && getPointerType(e) !== "touch" && (contain && dispatchCustomEvent(target2, unlockEventType), hoverEnd(e));
        },
        moveListener = function (e) {
          getPointerType(e) !== "touch" && onHoverUpdate != null && (e.x == null && (e.x = e.clientX), e.y == null && (e.y = e.clientY), onHoverUpdate(e));
        },
        hoverStart = function (e) {
          onHoverStart?.(e), onHoverChange?.(!0), onHoverUpdate != null && addMoveListener(target, disabled ? null : moveListener), addLeaveListener(target, disabled ? null : leaveListener);
        };
      addEnterListener(target, disabled ? null : function (e) {
        const target2 = targetRef.current;
        if (target2 != null && getPointerType(e) !== "touch") {
          contain && dispatchCustomEvent(target2, lockEventType), hoverStart(e);
          const lockListener = function (lockEvent) {
              lockEvent.target !== target2 && hoverEnd(e);
            },
            unlockListener = function (lockEvent) {
              lockEvent.target !== target2 && hoverStart(e);
            };
          addLockListener(target2, disabled ? null : lockListener), addUnlockListener(target2, disabled ? null : unlockListener);
        }
      });
    }
  }, [addEnterListener, addMoveListener, addLeaveListener, addLockListener, addUnlockListener, contain, disabled, onHoverStart, onHoverChange, onHoverUpdate, onHoverEnd, targetRef]);
}