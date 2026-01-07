import { internal } from '@legendapp/state';

// src/config/configureLegendState.ts
var { globalState, observableProperties: _observableProperties, observableFns, ObservablePrimitiveClass } = internal;
function configureLegendState({
  observableFunctions,
  observableProperties,
  jsonReplacer,
  jsonReviver
}) {
  if (observableFunctions) {
    for (const key in observableFunctions) {
      const fn = observableFunctions[key];
      observableFns.set(key, fn);
      ObservablePrimitiveClass.prototype[key] = function(...args) {
        return fn.call(this, this._node, ...args);
      };
    }
  }
  if (observableProperties) {
    for (const key in observableProperties) {
      const fns = observableProperties[key];
      _observableProperties.set(key, fns);
      Object.defineProperty(ObservablePrimitiveClass.prototype, key, {
        configurable: true,
        get() {
          return fns.get.call(this, this._node);
        },
        set(value) {
          return fns.set.call(this, this._node, value);
        }
      });
    }
  }
  if (jsonReplacer) {
    globalState.replacer = jsonReplacer;
  }
  if (jsonReviver) {
    globalState.reviver = jsonReviver;
  }
}

export { configureLegendState };
