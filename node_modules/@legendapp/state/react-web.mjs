import { isFunction, isEmpty } from '@legendapp/state';
import { reactive } from '@legendapp/state/react';
import { forwardRef, createElement } from 'react';

// src/react-web/$React.tsx
var bindInfoOneWay = {
  value: { handler: "onChange", getValue: (e) => e.target.value, defaultValue: "" }
};
var bindInfoInput = Object.assign(
  { checked: { handler: "onChange", getValue: (e) => e.target.checked } },
  bindInfoOneWay
);
var binders = /* @__PURE__ */ new Map([
  ["input", bindInfoInput],
  ["textarea", bindInfoOneWay],
  ["select", bindInfoOneWay]
]);
var $React = new Proxy(
  {},
  {
    get(target, p) {
      if (!target[p]) {
        const render = forwardRef((props, ref) => {
          const propsOut = { ...props };
          if (ref && (isFunction(ref) || !isEmpty(ref))) {
            propsOut.ref = ref;
          }
          return createElement(p, propsOut);
        });
        target[p] = reactive(render, [], binders.get(p));
      }
      return target[p];
    }
  }
);

export { $React };
