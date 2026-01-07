'use strict';

var state = require('@legendapp/state');

// src/as/setAsArray.ts
function setAsArray(set$) {
  return state.linked({
    get: () => Array.from(set$ == null ? void 0 : set$.get()),
    set: ({ value }) => set$.set(new Set(value))
  });
}

exports.setAsArray = setAsArray;
