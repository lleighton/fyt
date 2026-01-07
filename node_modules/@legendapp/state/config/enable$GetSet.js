'use strict';

var state = require('@legendapp/state');
var configureLegendState = require('@legendapp/state/config/configureLegendState');

// src/config/enable$GetSet.ts
function enable$GetSet() {
  configureLegendState.configureLegendState({
    observableProperties: {
      $: {
        get(node) {
          return state.internal.get(node);
        },
        set(node, value) {
          state.internal.set(node, value);
        }
      }
    }
  });
}
var enableDirectAccess = enable$GetSet;

exports.enable$GetSet = enable$GetSet;
exports.enableDirectAccess = enableDirectAccess;
