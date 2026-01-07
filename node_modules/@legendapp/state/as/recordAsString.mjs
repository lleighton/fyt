import { linked } from '@legendapp/state';

// src/as/recordAsString.ts
function recordAsString(record$) {
  return linked({
    get: () => JSON.stringify(record$.get()),
    set: ({ value }) => record$ == null ? void 0 : record$.set(JSON.parse(value || "{}"))
  });
}

export { recordAsString };
