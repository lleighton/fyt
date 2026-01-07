'use strict';

var state = require('@legendapp/state');

// src/as/arrayAsString.ts
function arrayAsString(arr$) {
  return state.linked({
    get: () => JSON.stringify(arr$ == null ? void 0 : arr$.get()),
    set: ({ value }) => arr$.set(JSON.parse(value || "[]"))
  });
}

exports.arrayAsString = arrayAsString;
