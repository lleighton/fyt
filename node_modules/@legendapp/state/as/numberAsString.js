'use strict';

var state = require('@legendapp/state');

// src/as/numberAsString.ts
function numberAsString(num$) {
  return state.linked({
    get: () => num$.get() + "",
    set: ({ value }) => num$ == null ? void 0 : num$.set(+value)
  });
}

exports.numberAsString = numberAsString;
