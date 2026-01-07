'use strict';

var state = require('@legendapp/state');

// src/as/stringAsSet.ts
function stringAsSet(str$) {
  return state.linked({
    get: () => new Set(JSON.parse((str$ == null ? void 0 : str$.get()) || "[]")),
    set: ({ value }) => str$ == null ? void 0 : str$.set(JSON.stringify(Array.from(value)))
  });
}

exports.stringAsSet = stringAsSet;
