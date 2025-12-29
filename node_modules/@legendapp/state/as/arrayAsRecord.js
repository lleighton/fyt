'use strict';

var state = require('@legendapp/state');

// src/as/arrayAsRecord.ts
function arrayAsRecord(arr$, keyField = "id") {
  return state.linked({
    get: () => {
      const record = {};
      const value = arr$.get();
      for (let i = 0; i < value.length; i++) {
        const v = value[i];
        const child = v[keyField];
        record[child[keyField]] = child;
      }
      return record;
    },
    set: ({ value }) => {
      if (value) {
        arr$.set(Object.values(value));
      } else {
        arr$.set(value);
      }
    }
  });
}

exports.arrayAsRecord = arrayAsRecord;
