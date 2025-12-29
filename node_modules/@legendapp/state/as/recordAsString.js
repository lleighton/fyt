'use strict';

var state = require('@legendapp/state');

// src/as/recordAsString.ts
function recordAsString(record$) {
  return state.linked({
    get: () => JSON.stringify(record$.get()),
    set: ({ value }) => record$ == null ? void 0 : record$.set(JSON.parse(value || "{}"))
  });
}

exports.recordAsString = recordAsString;
