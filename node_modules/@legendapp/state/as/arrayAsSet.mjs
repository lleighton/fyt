import { linked } from '@legendapp/state';

// src/as/arrayAsSet.ts
function arrayAsSet(arr$) {
  return linked({
    get: () => new Set(arr$.get()),
    set: ({ value }) => arr$.set(Array.from(value))
  });
}

export { arrayAsSet };
