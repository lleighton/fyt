import { linked, isNumber } from '@legendapp/state';

// src/as/stringAsNumber.ts
function stringAsNumber(num$) {
  return linked({
    get: () => {
      const num = +num$.get();
      return isNumber(num) ? +num : 0;
    },
    set: ({ value }) => num$ == null ? void 0 : num$.set(value + "")
  });
}

export { stringAsNumber };
