import { linked } from '@legendapp/state';

// src/as/stringAsSet.ts
function stringAsSet(str$) {
  return linked({
    get: () => new Set(JSON.parse((str$ == null ? void 0 : str$.get()) || "[]")),
    set: ({ value }) => str$ == null ? void 0 : str$.set(JSON.stringify(Array.from(value)))
  });
}

export { stringAsSet };
