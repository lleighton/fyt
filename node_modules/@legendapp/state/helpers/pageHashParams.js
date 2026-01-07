'use strict';

var state = require('@legendapp/state');

// src/helpers/pageHashParams.ts
var _options = { setter: "hash" };
function configurePageHashParams(options) {
  _options = options;
}
function toParams(str) {
  const ret = {};
  const searchParams = new URLSearchParams(str);
  for (const [key, value] of searchParams) {
    ret[key] = value;
  }
  return ret;
}
function toString(params) {
  return new URLSearchParams(params).toString().replace(/=$/, "");
}
var hasWindow = typeof window !== "undefined";
var pageHashParams = state.observable(
  hasWindow ? toParams(window.location.hash.slice(1)) : {}
);
if (hasWindow) {
  let isSetting = false;
  pageHashParams.onChange(({ value }) => {
    if (!isSetting) {
      const hash = "#" + toString(value);
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
    pageHashParams.set(toParams(window.location.hash.slice(1)));
    isSetting = false;
  };
  window.addEventListener("hashchange", cb);
}

exports.configurePageHashParams = configurePageHashParams;
exports.pageHashParams = pageHashParams;
