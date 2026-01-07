import { isObject, internal, tracking } from '@legendapp/state';
import { configureLegendState } from '@legendapp/state/config/configureLegendState';
import { useSelector } from '@legendapp/state/react';
import { createContext, __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED, useContext } from 'react';

// src/config/enableReactTracking.ts
function enableReactTracking({ auto, warnUnobserved, warnMissingUse }) {
  const { get } = internal;
  if (auto || process.env.NODE_ENV === "development" && (warnUnobserved || warnMissingUse)) {
    const ReactRenderContext = createContext(0);
    const isInRender = () => {
      try {
        const dispatcher = __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher.current;
        if (dispatcher) {
          useContext(ReactRenderContext);
          return true;
        }
      } catch (e) {
      }
      return false;
    };
    const isObserved = () => {
      return !!tracking.current;
    };
    const needsSelector = () => {
      if (!isObserved()) {
        return isInRender();
      }
      return false;
    };
    configureLegendState({
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
              return useSelector(() => get(node, options), isObject(options) ? options : void 0);
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

export { enableReactTracking };
