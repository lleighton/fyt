'use strict';

var state = require('@legendapp/state');

// src/helpers/undoRedo.ts
function undoRedo(obs$, options) {
  let history = [];
  let historyPointer = 0;
  let restoringFromHistory = false;
  const undos$ = state.observable(0);
  const redos$ = state.observable(0);
  function updateUndoRedo() {
    undos$.set(historyPointer);
    redos$.set(history.length - historyPointer - 1);
  }
  obs$.onChange(({ getPrevious }) => {
    if (restoringFromHistory)
      return;
    if (state.internal.globalState.isLoadingRemote || state.internal.globalState.isLoadingLocal)
      return;
    if (!history.length) {
      const previous = getPrevious();
      if (previous)
        history.push(state.internal.clone(previous));
      historyPointer = 0;
    }
    const snapshot = state.internal.clone(obs$.get());
    if (options == null ? void 0 : options.limit) {
      history = history.slice(Math.max(0, history.length - options.limit));
    } else {
      history = history.slice(0, historyPointer + 1);
    }
    history.push(snapshot);
    historyPointer = history.length - 1;
    updateUndoRedo();
  });
  return {
    undo() {
      if (historyPointer > 0) {
        historyPointer--;
        const snapshot = state.internal.clone(history[historyPointer]);
        restoringFromHistory = true;
        obs$.set(snapshot);
        restoringFromHistory = false;
      } else {
        console.warn("Already at the beginning of undo history");
      }
      updateUndoRedo();
    },
    redo() {
      if (historyPointer < history.length - 1) {
        historyPointer++;
        const snapshot = state.internal.clone(history[historyPointer]);
        restoringFromHistory = true;
        obs$.set(snapshot);
        restoringFromHistory = false;
      } else {
        console.warn("Already at the end of undo history");
      }
      updateUndoRedo();
    },
    undos$,
    redos$,
    getHistory: () => history
  };
}

exports.undoRedo = undoRedo;
