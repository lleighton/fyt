import { observable, isFunction } from '@legendapp/state';
import React from 'react';

// src/react-hooks/createObservableHook.ts
function overrideHooks(refObs) {
  React.useState = function useState(initialState) {
    var _a;
    const obs = (_a = refObs.current) != null ? _a : refObs.current = observable(isFunction(initialState) ? initialState() : initialState);
    return [obs.get(), obs.set];
  };
  React.useReducer = function useReducer(reducer, initializerArg, initializer) {
    var _a;
    const obs = (_a = refObs.current) != null ? _a : refObs.current = observable(
      initializerArg !== void 0 && isFunction(initializerArg) ? initializer(initializerArg) : initializerArg
    );
    const dispatch = (action) => {
      obs.set(reducer(obs.get(), action));
    };
    return [obs, dispatch];
  };
}
function createObservableHook(fn) {
  const _useState = React.useState;
  const _useReducer = React.useReducer;
  return function(...args) {
    const refObs = React.useRef();
    overrideHooks(refObs);
    fn(...args);
    React.useState = _useState;
    React.useReducer = _useReducer;
    return refObs.current;
  };
}

export { createObservableHook };
