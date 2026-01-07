import { measure, measureInWindow } from "@tamagui/use-element-layout";
const focusableElements = {
    A: !0,
    INPUT: !0,
    SELECT: !0,
    TEXTAREA: !0
  },
  UIManager = {
    blur(node) {
      try {
        node.blur();
      } catch {}
    },
    focus(node) {
      try {
        const name = node.nodeName;
        node.getAttribute("tabIndex") == null && focusableElements[name] == null && node.setAttribute("tabIndex", "-1"), node.focus();
      } catch {}
    },
    measure(node, callback) {
      return measure(node, callback);
    },
    measureInWindow(node, callback) {
      return measureInWindow(node, callback);
    },
    // note its flipped fail and success on purpose lol
    async measureLayout(node, relativeToNativeNode, onFail, onSuccess) {
      return measureLayout(node, relativeToNativeNode, onSuccess);
    },
    configureNextLayoutAnimation(config, onAnimationDidEnd) {
      onAnimationDidEnd();
    },
    // mocks
    setLayoutAnimationEnabledExperimental() {}
  };
export { UIManager };
//# sourceMappingURL=index.mjs.map
