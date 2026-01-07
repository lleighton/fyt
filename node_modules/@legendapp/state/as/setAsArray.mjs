import { linked } from '@legendapp/state';

// src/as/setAsArray.ts
function setAsArray(set$) {
  return linked({
    get: () => Array.from(set$ == null ? void 0 : set$.get()),
    set: ({ value }) => set$.set(new Set(value))
  });
}

export { setAsArray };
