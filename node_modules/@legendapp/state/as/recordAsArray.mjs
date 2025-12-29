import { linked } from '@legendapp/state';

// src/as/recordAsArray.ts
function recordAsArray(record$, keyField = "id") {
  return linked({
    get: () => Object.values(record$),
    set: ({ value }) => {
      if (value) {
        const record = {};
        for (let i = 0; i < value.length; i++) {
          const v = value[i];
          const child = v[keyField];
          record[child[keyField]] = child;
        }
        record$.set(record);
      } else {
        record$.set(value);
      }
    }
  });
}

export { recordAsArray };
