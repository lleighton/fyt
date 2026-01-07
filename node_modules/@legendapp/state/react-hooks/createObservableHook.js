'use strict';

var state = require('@legendapp/state');
var React = require('react');

function _interopDefault (e) { return e && e.__esModule ? e : { default: e }; }

var React__default = /*#__PURE__*/_interopDefault(React);

// src/react-hooks/createObservableHook.ts
function overrideHooks(refObs) {
  React__default.default.useState = function useState(initialState) {
    var _a;
    const obs = (_a = refObs.current) != null ? _a : refObs.current = state.observable(state.isFunction(initialState) ? initialState() : initialState);
    return [obs.get(), obs.set];
  };
  React__default.default.useReducer = function useReducer(reducer, initializerArg, initializer) {
    var _a;
    const obs = (_a = refObs.current) != null ? _a : refObs.current = state.observable(
      initializerArg !== void 0 && state.isFunction(initializerArg) ? initializer(initializerArg) : initializerArg
    );
    const dispatch = (action) => {
      obs.set(reducer(obs.get(), action));
    };
    return [obs, dispatch];
  };
}
function createObservableHook(fn) {
  const _useState = React__default.default.useState;
  const _useReducer = React__default.default.useReducer;
  return function(...args) {
    const refObs = React__default.default.useRef();
    overrideHooks(refObs);
    fn(...args);
    React__default.default.useState = _useState;
    React__default.default.useReducer = _useReducer;
    return refObs.current;
  };
}

exports.createObservableHook = createObservableHook;
