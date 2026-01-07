'use strict';

var state = require('@legendapp/state');
var configureLegendState = require('@legendapp/state/config/configureLegendState');
var react$1 = require('@legendapp/state/react');
var react = require('react');

// src/config/enableReactTracking.ts
function enableReactTracking({ auto, warnUnobserved, warnMissingUse }) {
  const { get } = state.internal;
  if (auto || process.env.NODE_ENV === "development" && (warnUnobserved || warnMissingUse)) {
    const ReactRenderContext = react.createContext(0);
    const isInRender = () => {
      try {
        const dispatcher = react.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher.current;
        if (dispatcher) {
          react.useContext(ReactRenderContext);
          return true;
        }
      } catch (e) {
      }
      return false;
    };
    const isObserved = () => {
      return !!state.tracking.current;
    };
    const needsSelector = () => {
      if (!isObserved()) {
        return isInRender();
      }
      return false;
    };
    configureLegendState.configureLegendState({
      observableFunctions: {
        get: (node, options) => {
          if (process.env.NODE_ENV === "development" && warnMissingUse) {
            if (isInRender()) {
              if (isObserved()) {
                console.warn(
                  "[legend-state] Detected a `get()` call in an observer component. It is recommended to use the `use$` hook instead to be compatible with React Compiler: https://legendapp.com/open-source/state/v3/react/react-api/#use$"
                );
              } else {
                console.warn(
                  "[legend-state] Detected a `get()` call in a component. You likely want to use the `use$` hook to be reactive to it changing, or change `get()` to `peek()` to get the value without tracking: https://legendapp.com/open-source/state/v3/react/react-api/#use$"
                );
              }
            }
          } else if (needsSelector()) {
            if (auto) {
              return react$1.useSelector(() => get(node, options), state.isObject(options) ? options : void 0);
            } else if (process.env.NODE_ENV === "development" && warnUnobserved) {
              console.warn(
                "[legend-state] Detected a `get()` call in an unobserved component. You may want to wrap it in observer: https://legendapp.com/open-source/state/v3/react/react-api/#observer"
              );
            }
          }
          return get(node, options);
        }
      }
    });
  }
}

exports.enableReactTracking = enableReactTracking;
