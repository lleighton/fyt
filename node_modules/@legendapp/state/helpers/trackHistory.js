'use strict';

var state = require('@legendapp/state');

// src/helpers/trackHistory.ts
function trackHistory(value$, targetObservable) {
  const history = targetObservable != null ? targetObservable : state.observable();
  value$.onChange(({ isFromPersist, isFromSync, changes }) => {
    if (!isFromPersist && !isFromSync) {
      const time = Date.now().toString();
      for (let i = 0; i < changes.length; i++) {
        const { path, prevAtPath, pathTypes } = changes[i];
        const obj = state.constructObjectWithPath(path, pathTypes, prevAtPath);
        state.mergeIntoObservable(history[time], obj);
      }
    }
  });
  return history;
}

exports.trackHistory = trackHistory;
