import { internal } from '@legendapp/state';
import { configureLegendState } from '@legendapp/state/config/configureLegendState';

// src/config/enable_PeekAssign.ts
function enable_PeekAssign() {
  configureLegendState({
    observableProperties: {
      _: {
        get(node) {
          return internal.peek(node);
        },
        set(node, value) {
          internal.setNodeValue(node, value);
        }
      }
    }
  });
}
var enableDirectAccess = enable_PeekAssign;

export { enableDirectAccess, enable_PeekAssign };
