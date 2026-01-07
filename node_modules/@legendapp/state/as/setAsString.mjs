import { linked } from '@legendapp/state';

// src/as/setAsString.ts
function setAsString(set$) {
  return linked({
    get: () => JSON.stringify(Array.from(set$ == null ? void 0 : set$.get())),
    set: ({ value }) => set$.set(new Set(JSON.parse(value || "[]")))
  });
}

export { setAsString };
