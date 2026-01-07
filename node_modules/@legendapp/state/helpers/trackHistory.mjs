import { observable, constructObjectWithPath, mergeIntoObservable } from '@legendapp/state';

// src/helpers/trackHistory.ts
function trackHistory(value$, targetObservable) {
  const history = targetObservable != null ? targetObservable : observable();
  value$.onChange(({ isFromPersist, isFromSync, changes }) => {
    if (!isFromPersist && !isFromSync) {
      const time = Date.now().toString();
      for (let i = 0; i < changes.length; i++) {
        const { path, prevAtPath, pathTypes } = changes[i];
        const obj = constructObjectWithPath(path, pathTypes, prevAtPath);
        mergeIntoObservable(history[time], obj);
      }
    }
  });
  return history;
}

export { trackHistory };
