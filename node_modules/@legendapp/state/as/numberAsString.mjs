import { linked } from '@legendapp/state';

// src/as/numberAsString.ts
function numberAsString(num$) {
  return linked({
    get: () => num$.get() + "",
    set: ({ value }) => num$ == null ? void 0 : num$.set(+value)
  });
}

export { numberAsString };
