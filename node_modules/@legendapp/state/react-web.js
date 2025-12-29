'use strict';

var state = require('@legendapp/state');
var react$1 = require('@legendapp/state/react');
var react = require('react');

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
        const render = react.forwardRef((props, ref) => {
          const propsOut = { ...props };
          if (ref && (state.isFunction(ref) || !state.isEmpty(ref))) {
            propsOut.ref = ref;
          }
          return react.createElement(p, propsOut);
        });
        target[p] = react$1.reactive(render, [], binders.get(p));
      }
      return target[p];
    }
  }
);

exports.$React = $React;
