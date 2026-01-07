import { internal } from '@legendapp/state';
import { configureLegendState } from '@legendapp/state/config/configureLegendState';
import { useSelector } from '@legendapp/state/react';

// src/config/enableReactUse.ts
var didWarn = false;
function enableReactUse() {
  configureLegendState({
    observableFunctions: {
      use: (node, options) => {
        if (process.env.NODE_ENV === "development" && !didWarn) {
          didWarn = true;
          console.warn(
            "[legend-state] enableReactUse() is deprecated. Please switch to using get() with observer, which is safer and more efficient. See https://legendapp.com/open-source/state/v3/react/react-api/"
          );
        }
        return useSelector(internal.getProxy(node), options);
      }
    }
  });
}

export { enableReactUse };
