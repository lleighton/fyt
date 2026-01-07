'use strict';

var state = require('@legendapp/state');
var configureLegendState = require('@legendapp/state/config/configureLegendState');
var react = require('@legendapp/state/react');

// src/config/enableReactUse.ts
var didWarn = false;
function enableReactUse() {
  configureLegendState.configureLegendState({
    observableFunctions: {
      use: (node, options) => {
        if (process.env.NODE_ENV === "development" && !didWarn) {
          didWarn = true;
          console.warn(
            "[legend-state] enableReactUse() is deprecated. Please switch to using get() with observer, which is safer and more efficient. See https://legendapp.com/open-source/state/v3/react/react-api/"
          );
        }
        return react.useSelector(state.internal.getProxy(node), options);
      }
    }
  });
}

exports.enableReactUse = enableReactUse;
