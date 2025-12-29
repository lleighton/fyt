import { linked } from '@legendapp/state';

// src/as/arrayAsString.ts
function arrayAsString(arr$) {
  return linked({
    get: () => JSON.stringify(arr$ == null ? void 0 : arr$.get()),
    set: ({ value }) => arr$.set(JSON.parse(value || "[]"))
  });
}

export { arrayAsString };
