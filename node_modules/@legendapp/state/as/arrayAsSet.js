'use strict';

var state = require('@legendapp/state');

// src/as/arrayAsSet.ts
function arrayAsSet(arr$) {
  return state.linked({
    get: () => new Set(arr$.get()),
    set: ({ value }) => arr$.set(Array.from(value))
  });
}

exports.arrayAsSet = arrayAsSet;
