'use strict';

var state = require('@legendapp/state');

// src/as/stringAsRecord.ts
function stringAsRecord(str$) {
  return state.linked({
    get: () => {
      return JSON.parse((str$ == null ? void 0 : str$.get()) || "{}");
    },
    set: ({ value }) => str$ == null ? void 0 : str$.set(JSON.stringify(value))
  });
}

exports.stringAsRecord = stringAsRecord;
