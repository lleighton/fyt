'use strict';

// src/react-reactive/enableReactComponents.ts
var isEnabled = false;
function enableReactComponents_(config) {
  if (isEnabled) {
    return;
  }
  isEnabled = true;
  const bindInfo = {
    value: { handler: "onChange", getValue: (e) => e.target.value, defaultValue: "" }
  };
  const bindInfoInput = Object.assign(
    { checked: { handler: "onChange", getValue: (e) => e.target.checked } },
    bindInfo
  );
  config({
    binders: {
      input: bindInfoInput,
      textarea: bindInfo,
      select: bindInfo
    }
  });
}

exports.enableReactComponents_ = enableReactComponents_;
