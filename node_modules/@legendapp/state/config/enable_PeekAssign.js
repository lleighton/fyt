'use strict';

var state = require('@legendapp/state');
var configureLegendState = require('@legendapp/state/config/configureLegendState');

// src/config/enable_PeekAssign.ts
function enable_PeekAssign() {
  configureLegendState.configureLegendState({
    observableProperties: {
      _: {
        get(node) {
          return state.internal.peek(node);
        },
        set(node, value) {
          state.internal.setNodeValue(node, value);
        }
      }
    }
  });
}
var enableDirectAccess = enable_PeekAssign;

exports.enableDirectAccess = enableDirectAccess;
exports.enable_PeekAssign = enable_PeekAssign;
