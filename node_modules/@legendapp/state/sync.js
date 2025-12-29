'use strict';

var state = require('@legendapp/state');
var sync = require('@legendapp/state/sync');

// src/sync/configureObservableSync.ts
var observableSyncConfiguration = {};
function configureObservableSync(options) {
  Object.assign(observableSyncConfiguration, options);
}
function removeNullUndefined(a, recursive) {
  const out = {};
  Object.keys(a).forEach((key) => {
    if (a[key] !== null && a[key] !== void 0) {
      out[key] = recursive && state.isObject(a[key]) ? removeNullUndefined(a[key]) : a[key];
    }
  });
  return out;
}
function diffObjects(obj1, obj2, deep = false) {
  const diff = {};
  if (!obj1)
    return obj2 || diff;
  if (!obj2)
    return obj1 || diff;
  const keys = /* @__PURE__ */ new Set([...Object.keys(obj1), ...Object.keys(obj2)]);
  keys.forEach((key) => {
    const o1 = obj1[key];
    const o2 = obj2[key];
    if (deep ? !deepEqual(o1, o2) : o1 !== o2) {
      if (!state.isDate(o1) || !state.isDate(o2) || o1.getTime() !== o2.getTime()) {
        diff[key] = o2;
      }
    }
  });
  return diff;
}
function deepEqual(a, b, ignoreFields, nullVsUndefined) {
  if (a === b)
    return true;
  if (state.isNullOrUndefined(a) !== state.isNullOrUndefined(b))
    return false;
  if (!state.isObject(a) || !state.isObject(b))
    return a === b;
  if (nullVsUndefined) {
    a = removeNullUndefined(
      a,
      /*recursive*/
      true
    );
    b = removeNullUndefined(
      b,
      /*recursive*/
      true
    );
  }
  const keysA = Object.keys(a).filter((key) => !(ignoreFields == null ? void 0 : ignoreFields.includes(key)));
  const keysB = Object.keys(b).filter((key) => !(ignoreFields == null ? void 0 : ignoreFields.includes(key)));
  if (keysA.length !== keysB.length)
    return false;
  return keysA.every((key) => {
    if (!Object.prototype.hasOwnProperty.call(b, key))
      return false;
    if (state.isDate(a[key]) && state.isDate(b[key])) {
      return a[key].getTime() === b[key].getTime();
    }
    return deepEqual(a[key], b[key], ignoreFields, nullVsUndefined);
  });
}
function combineTransforms(...transforms) {
  return {
    load: (value, method) => {
      let inValue = value;
      transforms.forEach((transform) => {
        if (transform.load) {
          inValue = transform.load(inValue, method);
        }
      });
      return inValue;
    },
    save: (value) => {
      let outValue = value;
      transforms.forEach((transform) => {
        if (transform.save) {
          outValue = transform.save(outValue);
        }
      });
      return outValue;
    }
  };
}
var ISO8601 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;
function transformStringifyKeys(...keys) {
  return {
    load: (value) => {
      keys.forEach((key) => {
        const keyRemote = state.isObject(key) ? key.from : key;
        const keyLocal = state.isObject(key) ? key.to : key;
        const v = value[keyRemote];
        if (!state.isNullOrUndefined(v)) {
          value[keyLocal] = state.isString(v) ? JSON.parse(v) : v;
        }
        if (keyLocal !== keyRemote) {
          delete value[keyRemote];
        }
      });
      return value;
    },
    save: (value) => {
      keys.forEach((key) => {
        const keyRemote = state.isObject(key) ? key.from : key;
        const keyLocal = state.isObject(key) ? key.to : key;
        const v = value[keyLocal];
        if (!state.isNullOrUndefined(v) && !state.isString(v)) {
          value[keyRemote] = JSON.stringify(v);
        }
        if (keyLocal !== keyRemote) {
          delete value[keyLocal];
        }
      });
      return value;
    }
  };
}
function transformStringifyDates(...args) {
  return {
    load: (value) => {
      const keys = args.length > 0 ? args : Object.keys(value);
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const keyValue = value[key];
        if (state.isString(keyValue) && keyValue.match(ISO8601)) {
          value[key] = new Date(keyValue);
        }
      }
      return value;
    },
    save: (value) => {
      const keys = args.length > 0 ? args : Object.keys(value);
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const keyValue = value[key];
        if (state.isDate(keyValue)) {
          value[key] = keyValue.toISOString();
        }
      }
      return value;
    }
  };
}

// src/is.ts
function isPromise(obj) {
  return obj instanceof Promise;
}

// src/sync/retry.ts
function calculateRetryDelay(retryOptions, retryNum) {
  const { backoff, delay = 1e3, infinite, times = 3, maxDelay = 3e4 } = retryOptions;
  if (infinite || retryNum < times) {
    const delayTime = Math.min(delay * (backoff === "constant" ? 1 : 2 ** retryNum), maxDelay);
    return delayTime;
  }
  return null;
}
function createRetryTimeout(retryOptions, retryNum, fn) {
  const delayTime = calculateRetryDelay(retryOptions, retryNum);
  if (delayTime) {
    return setTimeout(fn, delayTime);
  } else {
    return false;
  }
}
var mapRetryTimeouts = /* @__PURE__ */ new Map();
function runWithRetry(state, retryOptions, retryId, fn) {
  try {
    let value = fn(state);
    if (isPromise(value) && retryOptions) {
      let timeoutRetry;
      if (mapRetryTimeouts.has(retryId)) {
        clearTimeout(mapRetryTimeouts.get(retryId));
        mapRetryTimeouts.delete(retryId);
      }
      const clearRetryState = () => {
        if (timeoutRetry !== void 0) {
          clearTimeout(timeoutRetry);
          timeoutRetry = void 0;
        }
        mapRetryTimeouts.delete(retryId);
      };
      return new Promise((resolve, reject) => {
        const run = () => {
          value.then((val) => {
            state.retryNum = 0;
            clearRetryState();
            resolve(val);
          }).catch((error) => {
            if (timeoutRetry !== void 0) {
              clearTimeout(timeoutRetry);
              timeoutRetry = void 0;
            }
            state.retryNum++;
            if (state.cancelRetry) {
              clearRetryState();
              reject(error);
              return;
            }
            const timeout = createRetryTimeout(retryOptions, state.retryNum, () => {
              value = fn(state);
              run();
            });
            if (timeout === false) {
              state.cancelRetry = true;
              clearRetryState();
              reject(error);
            } else {
              timeoutRetry = timeout;
              mapRetryTimeouts.set(retryId, timeout);
            }
          });
        };
        run();
      });
    }
    return value;
  } catch (error) {
    mapRetryTimeouts.delete(retryId);
    return Promise.reject(error);
  }
}
async function waitForSet(waitForSet2, changes, value, params = {}) {
  const waitFn = state.isFunction(waitForSet2) ? waitForSet2({ changes, value, ...params }) : waitForSet2;
  if (waitFn) {
    await state.when(waitFn);
  }
}
var { clone } = state.internal;
function createRevertChanges(obs$, changes) {
  return () => {
    const previous = state.applyChanges(
      clone(obs$.peek()),
      changes,
      /*applyPrevious*/
      true
    );
    sync.onChangeRemote(() => {
      obs$.set(previous);
    });
  };
}

// src/sync/syncObservable.ts
var {
  clone: clone2,
  createPreviousHandler,
  deepMerge,
  getNode,
  getNodeValue,
  getValueAtPath,
  globalState,
  registerMiddleware,
  symbolLinked,
  setNodeValue
} = state.internal;
var mapSyncPlugins = /* @__PURE__ */ new WeakMap();
var allSyncStates = /* @__PURE__ */ new Map();
var metadatas = /* @__PURE__ */ new WeakMap();
var promisesLocalSaves = /* @__PURE__ */ new Set();
function parseLocalConfig(config) {
  return config ? state.isString(config) ? { table: config, config: { name: config } } : { table: config.name, config } : {};
}
function doInOrder(arg1, arg2) {
  return state.isPromise(arg1) ? arg1.then(arg2) : arg2(arg1);
}
function onChangeRemote2(cb) {
  state.endBatch(true);
  globalState.isLoadingRemote = true;
  state.beginBatch();
  cb();
  globalState.isLoadingRemote = false;
  state.endBatch(true);
}
async function transformSaveData(value, path, pathTypes, { transform }) {
  if (transform == null ? void 0 : transform.save) {
    const constructed = state.constructObjectWithPath(path, pathTypes, value);
    const saved = await transform.save(constructed);
    value = saved;
    const outPath = [];
    for (let i = 0; i < path.length; i++) {
      outPath[i] = Object.keys(value)[0];
      value = value[outPath[i]];
    }
    path = outPath;
  }
  return { value, path };
}
function transformLoadData(value, { transform }, doUserTransform, method) {
  if (doUserTransform && (transform == null ? void 0 : transform.load)) {
    value = transform.load(value, method);
  }
  return value;
}
async function updateMetadataImmediate(value$, localState, syncState$, syncOptions, newMetadata) {
  const saves = Array.from(promisesLocalSaves);
  if (saves.length > 0) {
    await Promise.all(saves);
  }
  const { pluginPersist } = localState;
  const { table, config } = parseLocalConfig(syncOptions.persist);
  const oldMetadata = metadatas.get(value$);
  const { lastSync } = newMetadata;
  const metadata = Object.assign({}, oldMetadata, newMetadata);
  metadatas.set(value$, metadata);
  if (pluginPersist) {
    await pluginPersist.setMetadata(table, metadata, config);
  }
  if (lastSync) {
    syncState$.assign({
      lastSync
    });
  }
}
function updateMetadata(value$, localState, syncState2, syncOptions, newMetadata) {
  if (localState.timeoutSaveMetadata) {
    clearTimeout(localState.timeoutSaveMetadata);
  }
  metadatas.set(value$, { ...metadatas.get(value$) || {}, ...newMetadata });
  localState.timeoutSaveMetadata = setTimeout(() => {
    updateMetadataImmediate(value$, localState, syncState2, syncOptions, metadatas.get(value$));
  }, 0);
}
var _queuedChanges = [];
var _queuedRemoteChanges = /* @__PURE__ */ new Map();
var _queuedRemoteChangesTimeouts = /* @__PURE__ */ new Map();
function mergeChanges(changes) {
  const changesByPath = /* @__PURE__ */ new Map();
  const changesOut = [];
  for (let i = 0; i < changes.length; i++) {
    const change = changes[i];
    const pathStr = change.path.join("/");
    const existing = changesByPath.get(pathStr);
    if (existing) {
      if (change.valueAtPath === existing.prevAtPath) {
        const idx = changesOut.indexOf(existing);
        if (idx >= 0) {
          changesOut.splice(idx, 1);
        }
        changesByPath.delete(pathStr);
      } else {
        existing.valueAtPath = change.valueAtPath;
        existing.pathTypes = change.pathTypes;
      }
    } else {
      let found = false;
      for (let u = 0; u < change.path.length; u++) {
        const path = change.path.slice(0, u).join("/");
        if (changesByPath.has(path)) {
          const remaining = change.path.slice(u);
          state.setAtPath(
            changesByPath.get(path).valueAtPath,
            remaining,
            change.pathTypes.slice(u),
            change.valueAtPath
          );
          found = true;
          break;
        }
      }
      if (!found) {
        changesByPath.set(pathStr, change);
        changesOut.push(change);
      }
    }
  }
  return changesOut;
}
function mergeQueuedChanges(allChanges) {
  const changesByOptionsRemote = /* @__PURE__ */ new Map();
  const changesByOptionsLocal = /* @__PURE__ */ new Map();
  const outRemote = /* @__PURE__ */ new Map();
  const outLocal = /* @__PURE__ */ new Map();
  for (let i = 0; i < allChanges.length; i++) {
    const value = allChanges[i];
    const { changes, inRemoteChange, syncOptions } = value;
    const targetMap = inRemoteChange ? outRemote : outLocal;
    const changesMap = inRemoteChange ? changesByOptionsRemote : changesByOptionsLocal;
    const existing = changesMap.get(syncOptions);
    const newChanges = existing ? [...existing, ...changes] : changes;
    const merged = mergeChanges(newChanges);
    changesMap.set(syncOptions, merged);
    value.changes = merged;
    targetMap.set(syncOptions, value);
  }
  return Array.from(outRemote.values()).concat(Array.from(outLocal.values()));
}
async function processQueuedChanges() {
  var _a, _b;
  const queuedChanges = mergeQueuedChanges(_queuedChanges);
  _queuedChanges = [];
  const pendingSyncOptions = /* @__PURE__ */ new Set();
  for (let i = 0; i < queuedChanges.length; i++) {
    const change = queuedChanges[i];
    if (!change.inRemoteChange) {
      if (!_queuedRemoteChanges.has(change.syncOptions)) {
        _queuedRemoteChanges.set(change.syncOptions, []);
      }
      pendingSyncOptions.add(change.syncOptions);
      _queuedRemoteChanges.get(change.syncOptions).push(change);
    }
  }
  const preppedChangesLocal = await Promise.all(queuedChanges.map(prepChangeLocal));
  await Promise.all(queuedChanges.map(prepChangeRemote));
  await Promise.all(preppedChangesLocal.map(doChangeLocal));
  for (const options of pendingSyncOptions) {
    const timeout = (_b = options.debounceSet) != null ? _b : (_a = observableSyncConfiguration) == null ? void 0 : _a.debounceSet;
    const timeoutSaveRemote = _queuedRemoteChangesTimeouts.get(options);
    const run = () => processQueuedRemoteChanges(options);
    if (timeout) {
      if (timeoutSaveRemote) {
        clearTimeout(timeoutSaveRemote);
      }
      _queuedRemoteChangesTimeouts.set(options, setTimeout(run, timeout));
    } else {
      run();
    }
  }
}
async function processQueuedRemoteChanges(syncOptions) {
  const arr = _queuedRemoteChanges.get(syncOptions);
  if (arr == null ? void 0 : arr.length) {
    const queuedRemoteChanges = mergeQueuedChanges(arr);
    _queuedRemoteChanges.set(syncOptions, []);
    const preppedChangesRemote = await Promise.all(queuedRemoteChanges.map(prepChangeRemote));
    preppedChangesRemote.forEach(doChangeRemote);
  }
}
async function prepChangeLocal(queuedChange) {
  const { syncState: syncState2, changes, syncOptions, inRemoteChange, isApplyingPending } = queuedChange;
  const persist = syncOptions.persist;
  const { config: configLocal } = parseLocalConfig(persist);
  const saveLocal = (persist == null ? void 0 : persist.name) && !configLocal.readonly && !isApplyingPending && syncState2.isPersistEnabled.peek();
  const saveRemote = !!(!inRemoteChange && (syncOptions == null ? void 0 : syncOptions.set) && syncState2.isSyncEnabled.peek());
  if (saveLocal || saveRemote) {
    if (saveLocal && !syncState2.isPersistLoaded.peek()) {
      console.error(
        "[legend-state] WARNING: An observable was changed before being loaded from persist",
        persist
      );
      return void 0;
    }
    const changesLocal = [];
    const changesPaths = /* @__PURE__ */ new Set();
    let promisesTransform = [];
    for (let i = changes.length - 1; i >= 0; i--) {
      const { path } = changes[i];
      let found = false;
      if (changesPaths.size > 0) {
        for (let u = 0; u < path.length; u++) {
          if (changesPaths.has((u === path.length - 1 ? path : path.slice(0, u + 1)).join("/"))) {
            found = true;
            break;
          }
        }
      }
      if (!found) {
        const pathStr = path.join("/");
        changesPaths.add(pathStr);
        const { prevAtPath, valueAtPath, pathTypes } = changes[i];
        if (saveLocal) {
          const promiseTransformLocal = transformSaveData(
            valueAtPath,
            path,
            pathTypes,
            configLocal
          );
          promisesTransform.push(
            doInOrder(promiseTransformLocal, ({ value: valueTransformed, path: pathTransformed }) => {
              changesLocal.push({
                path: pathTransformed,
                pathTypes,
                prevAtPath,
                valueAtPath: valueTransformed,
                pathStr: path === pathTransformed ? pathStr : pathTransformed.join("/")
              });
            })
          );
        }
      }
    }
    promisesTransform = promisesTransform.filter(Boolean);
    if (promisesTransform.length > 0) {
      await Promise.all(promisesTransform);
    }
    return { queuedChange, changesLocal, saveRemote };
  }
}
async function prepChangeRemote(queuedChange) {
  const {
    syncState: syncState2,
    changes,
    localState,
    syncOptions,
    inRemoteChange,
    isApplyingPending
  } = queuedChange;
  const persist = syncOptions.persist;
  const { config: configLocal } = parseLocalConfig(persist);
  const saveLocal = persist && !configLocal.readonly && !isApplyingPending && syncState2.isPersistEnabled.peek();
  const saveRemote = !inRemoteChange && (syncOptions == null ? void 0 : syncOptions.set) && syncState2.isSyncEnabled.peek();
  if (saveLocal || saveRemote) {
    if (saveLocal && !syncState2.isPersistLoaded.peek()) {
      console.error(
        "[legend-state] WARNING: An observable was changed before being loaded from persist",
        persist
      );
      return void 0;
    }
    const changesRemote = [];
    const changesPaths = /* @__PURE__ */ new Set();
    let promisesTransform = [];
    for (let i = changes.length - 1; i >= 0; i--) {
      const { path } = changes[i];
      let found = false;
      if (changesPaths.size > 0) {
        for (let u = 0; u < path.length; u++) {
          if (changesPaths.has((u === path.length - 1 ? path : path.slice(0, u + 1)).join("/"))) {
            found = true;
            break;
          }
        }
      }
      if (!found) {
        const pathStr = path.join("/");
        changesPaths.add(pathStr);
        const { prevAtPath, valueAtPath, pathTypes } = changes[i];
        if (saveRemote) {
          const promiseTransformRemote = transformSaveData(
            valueAtPath,
            path,
            pathTypes,
            syncOptions || {}
          );
          promisesTransform.push(
            doInOrder(promiseTransformRemote, ({ value: valueTransformed, path: pathTransformed }) => {
              var _a;
              if (!localState.pendingChanges) {
                localState.pendingChanges = {};
              }
              let found2 = false;
              for (let i2 = 0; !found2 && i2 < pathTransformed.length - 1; i2++) {
                const pathParent = pathTransformed.slice(0, i2 + 1).join("/");
                if ((_a = localState.pendingChanges[pathParent]) == null ? void 0 : _a.v) {
                  found2 = true;
                  const pathChild = pathTransformed.slice(i2 + 1);
                  const pathTypesChild = pathTypes.slice(i2 + 1);
                  state.setAtPath(
                    localState.pendingChanges[pathParent].v,
                    pathChild,
                    pathTypesChild,
                    valueAtPath
                  );
                }
              }
              if (!found2) {
                for (const key in localState.pendingChanges) {
                  if (key !== pathStr && key.startsWith(pathStr)) {
                    delete localState.pendingChanges[key];
                  }
                }
                if (!localState.pendingChanges[pathStr]) {
                  localState.pendingChanges[pathStr] = { p: prevAtPath != null ? prevAtPath : null, t: pathTypes };
                }
                localState.pendingChanges[pathStr].v = valueAtPath;
              }
              changesRemote.push({
                path: pathTransformed,
                pathTypes,
                prevAtPath,
                valueAtPath: valueTransformed,
                pathStr
              });
            })
          );
        }
      }
    }
    promisesTransform = promisesTransform.filter(Boolean);
    if (promisesTransform.length > 0) {
      await Promise.all(promisesTransform);
    }
    return { queuedChange, changesRemote };
  }
}
async function doChangeLocal(changeInfo) {
  if (!changeInfo)
    return;
  const { queuedChange, changesLocal, saveRemote } = changeInfo;
  const { value$: obs, syncState: syncState2, localState, syncOptions } = queuedChange;
  const { pluginPersist } = localState;
  const persist = syncOptions.persist;
  const saveLocal = !!(persist == null ? void 0 : persist.name);
  if (saveLocal) {
    const { table, config: configLocal } = parseLocalConfig(persist);
    const shouldSaveMetadata = persist == null ? void 0 : persist.retrySync;
    if (saveRemote && shouldSaveMetadata) {
      await updateMetadataImmediate(obs, localState, syncState2, syncOptions, {
        pending: localState.pendingChanges
      });
    }
    if (changesLocal.length > 0) {
      let promiseSet = pluginPersist.set(table, changesLocal, configLocal);
      if (promiseSet) {
        promiseSet = promiseSet.then(() => {
          promisesLocalSaves.delete(promiseSet);
        });
        promisesLocalSaves.add(promiseSet);
        await promiseSet;
      }
    }
  }
}
async function doChangeRemote(changeInfo) {
  var _a, _b;
  if (!changeInfo)
    return;
  const { queuedChange, changesRemote } = changeInfo;
  const { value$: obs$, syncState: syncState2, localState, syncOptions } = queuedChange;
  const { pluginPersist } = localState;
  const node = getNode(obs$);
  const state$ = node.state;
  const persist = syncOptions.persist;
  const { table, config: configLocal } = parseLocalConfig(persist);
  const { onBeforeSet, waitForSet: waitForSetParam, onAfterSet } = syncOptions || {};
  const shouldSaveMetadata = persist == null ? void 0 : persist.retrySync;
  const saveLocal = !!(persist == null ? void 0 : persist.name);
  if (changesRemote.length > 0) {
    if (!syncState2.isLoaded.peek()) {
      await state.when(syncState2.isLoaded);
      const pending = localState.pendingChanges;
      if (pending) {
        changesRemote.forEach((change) => {
          const key = change.pathStr;
          const pendingAtPath = pending[key];
          if (!state.isNullOrUndefined(pendingAtPath)) {
            const { p } = pendingAtPath;
            change.prevAtPath = p;
          }
        });
      }
    }
    if (waitForSetParam) {
      await waitForSet(waitForSetParam, changesRemote, obs$.peek());
    }
    let value = clone2(obs$.peek());
    const transformSave = (_a = syncOptions == null ? void 0 : syncOptions.transform) == null ? void 0 : _a.save;
    if (transformSave) {
      value = transformSave(value);
    }
    state$.numPendingSets.set((v) => (v || 0) + 1);
    state$.isSetting.set(true);
    const beforeSetParams = {
      cancel: false
    };
    onBeforeSet == null ? void 0 : onBeforeSet(beforeSetParams);
    if (!beforeSetParams.cancel) {
      let updateResult = void 0;
      let lastErrorHandled;
      const onSetError = (error, params, noThrow) => {
        var _a2;
        if (lastErrorHandled !== error) {
          if (!params) {
            params = {
              setParams,
              source: "set",
              type: "set",
              input: value,
              retry: setParams,
              revert: createRevertChanges(setParams.value$, setParams.changes)
            };
          }
          state$.error.set(error);
          (_a2 = syncOptions.onError) == null ? void 0 : _a2.call(syncOptions, error, params);
          lastErrorHandled = error;
          if (!noThrow) {
            throw error;
          }
        }
      };
      const setParams = {
        node,
        value$: obs$,
        changes: changesRemote,
        value,
        onError: onSetError,
        update: (params) => {
          if (updateResult) {
            const { value: value2, mode, changes } = params;
            updateResult = {
              value: deepMerge(updateResult.value, value2),
              mode,
              changes: changes ? [...updateResult.changes || [], ...changes] : updateResult.changes
            };
          } else {
            updateResult = params;
          }
        },
        refresh: syncState2.sync,
        retryNum: 0,
        cancelRetry: false
      };
      const savedPromise = runWithRetry(setParams, syncOptions.retry, node, async () => {
        return syncOptions.set(setParams);
      });
      let didError = false;
      if (state.isPromise(savedPromise)) {
        await savedPromise.catch((error) => {
          didError = true;
          if (!syncOptions.retry) {
            onSetError(error, void 0, true);
          }
        });
      }
      if (!didError || (updateResult == null ? void 0 : updateResult.changes)) {
        const { value: updateValue, changes: updateChanges = changesRemote } = updateResult || {};
        const pathStrs = Array.from(
          new Set(updateChanges.map((change) => change.pathStr))
        );
        if (pathStrs.length > 0) {
          let transformedChanges = void 0;
          const metadata = {};
          if (saveLocal) {
            const pendingMetadata = (_b = pluginPersist.getMetadata(table, configLocal)) == null ? void 0 : _b.pending;
            const pending = localState.pendingChanges;
            for (let i = 0; i < pathStrs.length; i++) {
              const pathStr = pathStrs[i];
              if (pendingMetadata == null ? void 0 : pendingMetadata[pathStr]) {
                delete pendingMetadata[pathStr];
                metadata.pending = pendingMetadata;
              }
              if (pending == null ? void 0 : pending[pathStr]) {
                delete pending[pathStr];
              }
            }
          }
          if (updateValue && !state.isEmpty(updateValue)) {
            transformedChanges = transformLoadData(updateValue, syncOptions, false, "set");
          }
          if (transformedChanges !== void 0) {
            if (state.isPromise(transformedChanges)) {
              transformedChanges = await transformedChanges;
            }
            onChangeRemote2(() => state.mergeIntoObservable(obs$, transformedChanges));
          }
          if (saveLocal) {
            if (shouldSaveMetadata && !state.isEmpty(metadata)) {
              updateMetadata(obs$, localState, syncState2, syncOptions, metadata);
            }
          }
        }
        state$.numPendingSets.set((v) => v - 1);
        state$.isSetting.set(state$.numPendingSets.peek() > 0);
        onAfterSet == null ? void 0 : onAfterSet();
      }
    }
  }
}
function onObsChange(value$, syncState2, localState, syncOptions, { changes, isFromPersist, isFromSync, getPrevious }) {
  if (!isFromPersist) {
    const inRemoteChange = isFromSync;
    const isApplyingPending = localState.isApplyingPending;
    _queuedChanges.push({
      value$,
      syncState: syncState2,
      localState,
      syncOptions,
      changes,
      inRemoteChange,
      isApplyingPending,
      getPrevious
    });
    if (_queuedChanges.length === 1) {
      queueMicrotask(processQueuedChanges);
    }
  }
}
async function loadLocal(value$, syncOptions, syncState$, localState) {
  var _a, _b, _c;
  const { persist } = syncOptions;
  const node = getNode(value$);
  const nodeValue = getNodeValue(getNode(node.state));
  const syncStateValue = syncState$.peek();
  const prevResetPersistence = nodeValue.resetPersistence;
  if (persist == null ? void 0 : persist.name) {
    const PersistPlugin = persist.plugin || ((_a = observableSyncConfiguration.persist) == null ? void 0 : _a.plugin);
    const { table, config } = parseLocalConfig(persist);
    syncStateValue.numPendingLocalLoads = (syncStateValue.numPendingLocalLoads || 0) + 1;
    if (!PersistPlugin) {
      throw new Error("Local persist is not configured");
    }
    if (!mapSyncPlugins.has(PersistPlugin)) {
      const persistPlugin2 = state.isFunction(PersistPlugin) ? new PersistPlugin() : PersistPlugin;
      const mapValue = { plugin: persistPlugin2, initialized: state.observable(false) };
      mapSyncPlugins.set(PersistPlugin, mapValue);
      if (persistPlugin2.initialize) {
        const initializePromise = (_c = persistPlugin2.initialize) == null ? void 0 : _c.call(persistPlugin2, ((_b = observableSyncConfiguration) == null ? void 0 : _b.persist) || {});
        if (state.isPromise(initializePromise)) {
          await initializePromise;
        }
      }
      mapValue.initialized.set(true);
    }
    const { plugin, initialized: initialized$ } = mapSyncPlugins.get(PersistPlugin);
    const persistPlugin = plugin;
    localState.pluginPersist = persistPlugin;
    if (!initialized$.peek()) {
      await state.when(initialized$);
    }
    if (persistPlugin.loadTable) {
      try {
        const promise = persistPlugin.loadTable(table, config);
        if (promise) {
          await promise;
        }
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error(
            "[legend-state] Error loading local cache. This would be a crashing error in production.",
            err
          );
        } else {
          throw err;
        }
      }
    }
    const prevValue = getNodeValue(node);
    let value = persistPlugin.getTable(table, prevValue, config);
    const metadata = persistPlugin.getMetadata(table, config);
    if (metadata) {
      metadatas.set(value$, metadata);
      localState.pendingChanges = metadata.pending;
      syncState$.assign({
        lastSync: metadata.lastSync
      });
    }
    if (value !== void 0) {
      const { transform } = config;
      value = transformLoadData(value, { transform }, true, "get");
      if (state.isPromise(value)) {
        value = await value;
      }
      node.root.isLoadingLocal = true;
      state.internal.globalState.isLoadingLocal = true;
      if (value === null && (!prevValue || prevValue[symbolLinked])) {
        value$.set(value);
      } else {
        state.mergeIntoObservable(value$, value);
      }
      node.root.isLoadingLocal = false;
      state.internal.globalState.isLoadingLocal = false;
    }
    syncStateValue.numPendingLocalLoads--;
    nodeValue.resetPersistence = () => Promise.all(
      [
        prevResetPersistence,
        persistPlugin.deleteTable(table, config),
        persistPlugin.deleteMetadata(table, config)
      ].filter(Boolean)
    );
  } else {
    if ((process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") && persist && persist.plugin && !Object.hasOwn(persist, "name")) {
      console.warn(
        "[legend-state] Trying to syncObservable without `name` defined. Please include a `name` property in the `persist` configuration."
      );
    }
    nodeValue.resetPersistence = () => prevResetPersistence == null ? void 0 : prevResetPersistence();
  }
  nodeValue.clearPersist = nodeValue.resetPersistence;
  syncState$.isPersistLoaded.set(!(syncStateValue.numPendingLocalLoads > 0));
}
function syncObservable(obs$, syncOptionsOrSynced) {
  let syncOptions = syncOptionsOrSynced;
  if (state.isFunction(syncOptions)) {
    syncOptions = syncOptions()[symbolLinked];
  }
  const node = getNode(obs$);
  if ((process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") && (!obs$ || !node)) {
    throw new Error("[legend-state] syncObservable called with undefined observable");
  }
  syncOptions = deepMerge(
    {
      syncMode: "auto"
    },
    observableSyncConfiguration,
    removeNullUndefined(syncOptions || {})
  );
  const localState = {};
  let sync;
  const syncState$ = state.syncState(obs$);
  const syncStateValue = getNodeValue(getNode(syncState$));
  allSyncStates.set(syncState$, node);
  syncStateValue.getPendingChanges = () => localState.pendingChanges;
  let lastErrorHandled;
  const onGetError = (error, params, noThrow) => {
    var _a;
    if (lastErrorHandled !== error) {
      if (!params) {
        params = {
          source: "get",
          type: "get",
          retry: params
        };
      }
      syncState$.error.set(error);
      (_a = syncOptions.onError) == null ? void 0 : _a.call(syncOptions, error, params);
      lastErrorHandled = error;
      if (!noThrow) {
        throw error;
      }
    }
  };
  loadLocal(obs$, syncOptions, syncState$, localState);
  let isWaitingForLoad = !!syncOptions.get;
  if (isWaitingForLoad) {
    syncStateValue.numPendingRemoteLoads = (syncStateValue.numPendingRemoteLoads || 0) + 1;
  }
  syncState$.isLoaded.set(!syncState$.numPendingRemoteLoads.peek());
  let isSynced = false;
  let isSubscribed = false;
  let isApplyingPendingAfterSync = false;
  let unsubscribe = void 0;
  const applyPending = (pending) => {
    if (pending && !state.isEmpty(pending)) {
      const keys = Object.keys(pending);
      const value = getNodeValue(node);
      const changes = [];
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const path = key.split("/").filter((p2) => p2 !== "");
        const { p, t, v } = pending[key];
        const valueAtPath = getValueAtPath(value, path);
        if (isApplyingPendingAfterSync || !deepEqual(valueAtPath, v)) {
          changes.push({ path, valueAtPath: v, prevAtPath: p, pathTypes: t });
        }
      }
      if (changes.length > 0) {
        localState.isApplyingPending = true;
        onObsChange(obs$, syncState$, localState, syncOptions, {
          value,
          isFromPersist: false,
          isFromSync: false,
          getPrevious: createPreviousHandler(value, changes),
          changes
        });
        localState.isApplyingPending = false;
      }
    }
  };
  const { get, subscribe } = syncOptions;
  if (get || subscribe) {
    const callSync = () => sync();
    sync = async (options) => {
      if (isSynced && (!getNodeValue(getNode(syncState$)).isSyncEnabled || state.shouldIgnoreUnobserved(node, sync))) {
        if (unsubscribe) {
          isSubscribed = false;
          unsubscribe();
          unsubscribe = void 0;
        }
        return;
      }
      const metadata = metadatas.get(obs$);
      if (metadata && (options == null ? void 0 : options.resetLastSync)) {
        metadata.lastSync = void 0;
        syncState$.lastSync.set(void 0);
      }
      const lastSync = metadata == null ? void 0 : metadata.lastSync;
      const pending = localState.pendingChanges;
      const { waitFor } = syncOptions;
      const runGet = () => {
        var _a;
        const onChange = async ({ value, mode, lastSync: lastSync2 }) => {
          var _a2;
          mode = mode || syncOptions.mode || "set";
          if (value !== void 0) {
            value = transformLoadData(value, syncOptions, true, "get");
            if (state.isPromise(value)) {
              value = await value;
            }
            const pending2 = localState.pendingChanges;
            const currentValue = obs$.peek();
            if (pending2) {
              let didChangeMetadata = false;
              Object.keys(pending2).forEach((key) => {
                const p = key.split("/").filter((k) => k !== "");
                const { v, t } = pending2[key];
                if (t.length === 0 || !value) {
                  const oldValue = clone2(value);
                  pending2[key].p = key ? oldValue[key] : oldValue;
                  if (state.isObject(value) && state.isObject(v)) {
                    Object.assign(value, key ? { [key]: v } : v);
                  } else if (!key) {
                    value = v;
                  }
                } else if (value[p[0]] !== void 0) {
                  const curValue = getValueAtPath(currentValue, p);
                  const newValue = getValueAtPath(value, p);
                  if (JSON.stringify(curValue) === JSON.stringify(newValue)) {
                    delete pending2[key];
                    didChangeMetadata = true;
                  } else {
                    const oldValue = clone2(value);
                    pending2[key].p = getValueAtPath(oldValue, p);
                    didChangeMetadata = true;
                    value = state.setAtPath(
                      value,
                      p,
                      t,
                      v,
                      "merge",
                      obs$.peek(),
                      (path, value2) => {
                        delete pending2[key];
                        pending2[path.join("/")] = {
                          p: null,
                          v: value2,
                          t: t.slice(0, path.length)
                        };
                      }
                    );
                  }
                }
              });
              if (didChangeMetadata && syncOptions.persist) {
                updateMetadataImmediate(obs$, localState, syncState$, syncOptions, {
                  pending: pending2
                });
              }
            }
            if (options == null ? void 0 : options.resetLastSync) {
              setNodeValue(node, (_a2 = syncOptions.initial) != null ? _a2 : void 0);
            }
            onChangeRemote2(() => {
              if (state.isPlainObject(value)) {
                value = state.ObservableHint.plain(value);
              }
              if (mode === "assign") {
                obs$.assign(value);
              } else if (mode === "append") {
                if ((process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") && !state.isArray(value)) {
                  console.error("[legend-state] mode:append expects the value to be an array");
                }
                obs$.push(...value);
              } else if (mode === "prepend") {
                if ((process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") && !state.isArray(value)) {
                  console.error("[legend-state] mode:prepend expects the value to be an array");
                }
                obs$.splice(0, 0, ...value);
              } else if (mode === "merge") {
                state.mergeIntoObservable(obs$, value);
              } else {
                obs$.set(value);
              }
            });
          }
          if (lastSync2 && syncOptions.persist) {
            updateMetadata(obs$, localState, syncState$, syncOptions, {
              lastSync: lastSync2
            });
          }
        };
        if (node.activationState) {
          node.activationState.onChange = onChange;
        }
        if (!isSubscribed && syncOptions.subscribe) {
          const subscribe2 = syncOptions.subscribe;
          const doSubscribe = () => {
            isSubscribed = true;
            const subscribeParams = {
              node,
              value$: obs$,
              lastSync,
              update: (params) => {
                state.when(
                  () => !get || syncState$.isLoaded.get(),
                  () => {
                    state.when(waitFor || true, () => {
                      params.mode || (params.mode = syncOptions.mode || "merge");
                      onChange(params);
                      if (!syncState$.isLoaded.peek()) {
                        syncState$.assign({
                          isLoaded: syncStateValue.numPendingRemoteLoads < 1,
                          error: void 0,
                          isGetting: syncStateValue.numPendingGets > 0
                        });
                      }
                    });
                  }
                );
              },
              refresh: () => state.when(syncState$.isLoaded, callSync),
              onError: (error) => onGetError(error, {
                source: "subscribe",
                subscribeParams,
                type: "get",
                retry: {}
              })
            };
            unsubscribe = subscribe2(subscribeParams);
            registerMiddleware(node, "listeners-cleared", () => {
              if (unsubscribe) {
                isSubscribed = false;
                unsubscribe();
                unsubscribe = void 0;
              }
            });
            registerMiddleware(node, "listener-added", () => {
              if (!isSubscribed) {
                doSubscribe();
              }
            });
          };
          if (waitFor) {
            state.whenReady(waitFor, doSubscribe);
          } else {
            doSubscribe();
          }
        }
        const existingValue = getNodeValue(node);
        if (get) {
          const getParams = {
            node,
            value$: obs$,
            value: state.isFunction(existingValue) || (existingValue == null ? void 0 : existingValue[symbolLinked]) ? void 0 : existingValue,
            mode: syncOptions.mode,
            refresh: sync,
            options: syncOptions,
            lastSync,
            updateLastSync: (lastSync2) => getParams.lastSync = lastSync2,
            onError: onGetError,
            retryNum: 0,
            cancelRetry: false
          };
          let modeBeforeReset = void 0;
          const beforeGetParams = {
            value: getParams.value,
            lastSync,
            pendingChanges: pending && !state.isEmpty(pending) ? pending : void 0,
            clearPendingChanges: async () => {
              localState.pendingChanges = {};
              await updateMetadataImmediate(obs$, localState, syncState$, syncOptions, {
                pending: localState.pendingChanges
              });
            },
            resetCache: () => {
              var _a2;
              modeBeforeReset = getParams.mode;
              getParams.mode = "set";
              return (_a2 = syncStateValue.resetPersistence) == null ? void 0 : _a2.call(syncStateValue);
            },
            cancel: false
          };
          (_a = syncOptions.onBeforeGet) == null ? void 0 : _a.call(syncOptions, beforeGetParams);
          if (!beforeGetParams.cancel) {
            syncState$.assign({
              numPendingGets: (syncStateValue.numPendingGets || 0) + 1,
              isGetting: true
            });
            const got = runWithRetry(getParams, syncOptions.retry, node, (retryEvent) => {
              const params = getParams;
              params.cancelRetry = retryEvent.cancelRetry;
              params.retryNum = retryEvent.retryNum;
              return get(params);
            });
            const numGets = node.numGets = (node.numGets || 0) + 1;
            const handle = (value) => {
              syncState$.numPendingGets.set((v) => v - 1);
              if (isWaitingForLoad) {
                isWaitingForLoad = false;
                syncStateValue.numPendingRemoteLoads--;
              }
              if (numGets >= (node.getNumResolved || 0)) {
                node.getNumResolved = node.numGets;
                onChange({
                  value,
                  lastSync: getParams.lastSync,
                  mode: getParams.mode
                });
              }
              if (modeBeforeReset) {
                getParams.mode = modeBeforeReset;
                modeBeforeReset = void 0;
              }
              syncState$.assign({
                isLoaded: syncStateValue.numPendingRemoteLoads < 1,
                error: void 0,
                isGetting: syncStateValue.numPendingGets > 0
              });
            };
            if (state.isPromise(got)) {
              got.then(handle).catch((error) => {
                onGetError(error, { getParams, source: "get", type: "get", retry: getParams }, true);
              });
            } else {
              handle(got);
            }
          }
        }
      };
      if (waitFor) {
        state.whenReady(waitFor, () => state.trackSelector(runGet, callSync));
      } else {
        state.trackSelector(runGet, callSync);
      }
      if (!isSynced) {
        isSynced = true;
        isApplyingPendingAfterSync = true;
        applyPending(pending);
        isApplyingPendingAfterSync = false;
      }
    };
    syncStateValue.sync = sync;
  } else {
    if (!isSynced) {
      isApplyingPendingAfterSync = true;
      applyPending(localState.pendingChanges);
      isApplyingPendingAfterSync = false;
    }
  }
  syncStateValue.reset = async () => {
    const wasPersistEnabled = syncStateValue.isPersistEnabled;
    const wasSyncEnabled = syncStateValue.isSyncEnabled;
    const metadata = metadatas.get(obs$);
    if (metadata) {
      Object.assign(metadata, { lastSync: void 0, pending: void 0 });
    }
    const newState = {
      isPersistEnabled: false,
      isSyncEnabled: false,
      lastSync: void 0,
      numPendingGets: 0,
      isLoaded: false,
      isGetting: false,
      isSetting: false,
      numPendingSets: 0,
      syncCount: 0
    };
    Object.assign(syncStateValue, newState);
    isSynced = false;
    isSubscribed = false;
    unsubscribe == null ? void 0 : unsubscribe();
    unsubscribe = void 0;
    const promise = syncStateValue.resetPersistence();
    onChangeRemote2(() => {
      var _a;
      obs$.set((_a = syncOptions.initial) != null ? _a : void 0);
    });
    syncState$.isLoaded.set(false);
    syncStateValue.isPersistEnabled = wasPersistEnabled;
    syncStateValue.isSyncEnabled = wasSyncEnabled;
    node.dirtyFn = sync;
    await promise;
  };
  syncState$.lastSync.onChange(({ value }) => {
    const metadata = metadatas.get(obs$);
    if (metadata && metadata.lastSync !== value) {
      updateMetadataImmediate(obs$, localState, syncState$, syncOptions, {
        lastSync: value
      });
    }
  });
  const onAllPersistLoaded = () => {
    var _a, _b;
    let parentNode = node;
    while (parentNode) {
      if (((_b = (_a = parentNode.state) == null ? void 0 : _a.isPersistLoaded) == null ? void 0 : _b.get()) === false) {
        return false;
      }
      parentNode = parentNode.parent;
    }
    return true;
  };
  state.when(onAllPersistLoaded, function() {
    if ((syncOptions.get || syncOptions.subscribe) && syncOptions.syncMode === "auto") {
      sync();
    }
    if ((syncOptions == null ? void 0 : syncOptions.set) || (syncOptions == null ? void 0 : syncOptions.persist)) {
      obs$.onChange(
        onObsChange.bind(this, obs$, syncState$, localState, syncOptions)
      );
    }
  });
  return syncState$;
}
function getAllSyncStates() {
  return Array.from(allSyncStates.entries());
}
var { getProxy, globalState: globalState2, setNodeValue: setNodeValue2, getNodeValue: getNodeValue2 } = state.internal;
function enableActivateSyncedNode() {
  globalState2.activateSyncedNode = function activateSyncedNode(node, newValue) {
    const obs$ = getProxy(node);
    if (node.activationState) {
      const {
        get: getOrig,
        initial,
        set,
        onChange
      } = node.activationState;
      let promiseReturn = void 0;
      const get = getOrig ? (params) => {
        return promiseReturn = getOrig(params);
      } : void 0;
      const nodeVal = getNodeValue2(node);
      if (promiseReturn !== void 0) {
        newValue = promiseReturn;
      } else if (nodeVal !== void 0 && !state.isFunction(nodeVal)) {
        newValue = nodeVal;
      } else {
        newValue = initial;
      }
      setNodeValue2(node, promiseReturn ? void 0 : newValue);
      node.isComputing = true;
      syncObservable(obs$, { ...node.activationState, get, set });
      node.isComputing = false;
      return { update: onChange, value: promiseReturn != null ? promiseReturn : newValue };
    } else {
      let update = void 0;
      const get = async (params) => {
        update = params.refresh;
        if (state.isPromise(newValue)) {
          try {
            newValue = await newValue;
          } catch (e) {
          }
        }
        return newValue;
      };
      syncObservable(obs$, {
        get
      });
      return { update, value: newValue };
    }
  };
}

// src/sync/synced.ts
function synced(params) {
  installPersistActivateNode();
  if (state.isFunction(params)) {
    params = { get: params };
  }
  return state.linked({ ...params, synced: true });
}
var didInstall = false;
function installPersistActivateNode() {
  if (!didInstall) {
    enableActivateSyncedNode();
    didInstall = true;
  }
}
var { deepMerge: deepMerge2 } = state.internal;
function configureSynced(fnOrOrigOptions, origOptions) {
  const fn = origOptions ? fnOrOrigOptions : synced;
  origOptions = origOptions != null ? origOptions : fnOrOrigOptions;
  return (options) => {
    const merged = deepMerge2(origOptions, options);
    return fn(merged);
  };
}

// sync.ts
var internal5 = {
  observableSyncConfiguration,
  waitForSet,
  runWithRetry
};

exports.combineTransforms = combineTransforms;
exports.configureObservableSync = configureObservableSync;
exports.configureSynced = configureSynced;
exports.createRevertChanges = createRevertChanges;
exports.deepEqual = deepEqual;
exports.diffObjects = diffObjects;
exports.getAllSyncStates = getAllSyncStates;
exports.internal = internal5;
exports.mapSyncPlugins = mapSyncPlugins;
exports.onChangeRemote = onChangeRemote2;
exports.removeNullUndefined = removeNullUndefined;
exports.syncObservable = syncObservable;
exports.synced = synced;
exports.transformStringifyDates = transformStringifyDates;
exports.transformStringifyKeys = transformStringifyKeys;
