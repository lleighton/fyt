'use strict';

var state = require('@legendapp/state');

// src/as/stringAsArray.ts
function stringAsArray(str$) {
  return state.linked({
    get: () => JSON.parse((str$ == null ? void 0 : str$.get()) || "[]"),
    set: ({ value }) => str$ == null ? void 0 : str$.set(JSON.stringify(value))
  });
}

exports.stringAsArray = stringAsArray;
