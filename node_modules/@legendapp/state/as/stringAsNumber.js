'use strict';

var state = require('@legendapp/state');

// src/as/stringAsNumber.ts
function stringAsNumber(num$) {
  return state.linked({
    get: () => {
      const num = +num$.get();
      return state.isNumber(num) ? +num : 0;
    },
    set: ({ value }) => num$ == null ? void 0 : num$.set(value + "")
  });
}

exports.stringAsNumber = stringAsNumber;
