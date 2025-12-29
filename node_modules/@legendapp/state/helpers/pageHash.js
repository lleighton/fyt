'use strict';

var state = require('@legendapp/state');

// src/helpers/pageHash.ts
var _options = { setter: "hash" };
function configurePageHash(options) {
  _options = options;
}
var hasWindow = typeof window !== "undefined";
var pageHash = state.observable(hasWindow ? window.location.hash.slice(1) : "");
if (hasWindow) {
  let isSetting = false;
  pageHash.onChange(({ value }) => {
    if (!isSetting) {
      const hash = "#" + value;
      const setter = (_options == null ? void 0 : _options.setter) || "hash";
      if (setter === "pushState") {
        history.pushState(null, null, hash);
      } else if (setter === "replaceState") {
        history.replaceState(null, null, hash);
      } else {
        location.hash = hash;
      }
    }
  });
  const cb = () => {
    isSetting = true;
    pageHash.set(window.location.hash.slice(1));
    isSetting = false;
  };
  window.addEventListener("hashchange", cb);
}

exports.configurePageHash = configurePageHash;
exports.pageHash = pageHash;
