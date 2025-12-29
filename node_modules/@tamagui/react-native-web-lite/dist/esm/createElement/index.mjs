import { AccessibilityUtil, LocaleProvider, createDOMProps, stylesFromProps } from "@tamagui/react-native-web-internals";
import { getStyleTags, insertStyleRules, useDidFinishSSR } from "@tamagui/web";
import React, { useInsertionEffect, useMemo } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
const useCreateElement = (component, props, options) => {
    const {
        element,
        styles
      } = createElementAndStyles(component, props, options),
      isHydrated = useDidFinishSSR(),
      styleTags = useMemo(() => isHydrated || !styles ? null : getStyleTags(styles), [
        // never changes
      ]);
    return useInsertionEffect(() => {
      if (!styles) return;
      const styleObj = {};
      for (const style of styles) styleObj[style[0]] = style;
      insertStyleRules(styleObj);
    }, [styles]), /* @__PURE__ */jsxs(Fragment, {
      children: [element, styleTags]
    });
  },
  createElement = (component, props, options) => {
    const {
      element,
      styles
    } = createElementAndStyles(component, props, options);
    return /* @__PURE__ */jsxs(Fragment, {
      children: [element, styles ? getStyleTags(styles) : null]
    });
  },
  createElementAndStyles = (component, props, options) => {
    let accessibilityComponent;
    component && component.constructor === String && (accessibilityComponent = AccessibilityUtil.propsToAccessibilityComponent(props));
    const Component = accessibilityComponent || component,
      domProps = createDOMProps(Component, props, options),
      styles = stylesFromProps.get(domProps);
    let element = React.createElement(Component, domProps);
    return {
      element: domProps.dir ? /* @__PURE__ */jsx(LocaleProvider, {
        direction: domProps.dir,
        locale: domProps.lang,
        children: element
      }) : element,
      styles
    };
  };
export { createElement, useCreateElement };
//# sourceMappingURL=index.mjs.map
