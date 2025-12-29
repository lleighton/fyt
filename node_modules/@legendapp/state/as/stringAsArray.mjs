import { linked } from '@legendapp/state';

// src/as/stringAsArray.ts
function stringAsArray(str$) {
  return linked({
    get: () => JSON.parse((str$ == null ? void 0 : str$.get()) || "[]"),
    set: ({ value }) => str$ == null ? void 0 : str$.set(JSON.stringify(value))
  });
}

export { stringAsArray };
