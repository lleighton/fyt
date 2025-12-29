import { internal } from '@legendapp/state';
import { configureLegendState } from '@legendapp/state/config/configureLegendState';

// src/config/enable$GetSet.ts
function enable$GetSet() {
  configureLegendState({
    observableProperties: {
      $: {
        get(node) {
          return internal.get(node);
        },
        set(node, value) {
          internal.set(node, value);
        }
      }
    }
  });
}
var enableDirectAccess = enable$GetSet;

export { enable$GetSet, enableDirectAccess };
