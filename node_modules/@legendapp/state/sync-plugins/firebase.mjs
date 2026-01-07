import { observable, symbolDelete, isString, isArray, isObject, computeSelector, isFunction, isNullOrUndefined, isPromise, isNumber } from '@legendapp/state';
import { syncedCrud } from '@legendapp/state/sync-plugins/crud';
import { getAuth } from 'firebase/auth';
import { ref, getDatabase, query, orderByChild, startAt, update, onValue, onChildAdded, onChildChanged, onChildRemoved, serverTimestamp, remove, push } from 'firebase/database';

// src/sync-plugins/firebase.ts
var validateMap;
function transformObjectFields(dataIn, map) {
  if (process.env.NODE_ENV === "development") {
    validateMap(map);
  }
  let ret = dataIn;
  if (dataIn) {
    if (dataIn === symbolDelete)
      return dataIn;
    if (isString(dataIn)) {
      return map[dataIn];
    }
    ret = {};
    const dict = Object.keys(map).length === 1 && map["_dict"];
    for (const key in dataIn) {
      let v = dataIn[key];
      if (dict) {
        ret[key] = transformObjectFields(v, dict);
      } else {
        const mapped = map[key];
        if (mapped === void 0) {
          if (key !== "@") {
            ret[key] = v;
            if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
              console.error("A fatal field transformation error has occurred", key, dataIn, map);
            }
          }
        } else if (mapped !== null) {
          if (v !== void 0 && v !== null) {
            if (map[key + "_val"]) {
              const mapChild = map[key + "_val"];
              if (isArray(v)) {
                v = v.map((vChild) => mapChild[vChild]);
              } else {
                v = mapChild[v];
              }
            } else if (map[key + "_arr"] && isArray(v)) {
              const mapChild = map[key + "_arr"];
              v = v.map((vChild) => transformObjectFields(vChild, mapChild));
            } else if (isObject(v)) {
              if (map[key + "_obj"]) {
                v = transformObjectFields(v, map[key + "_obj"]);
              } else if (map[key + "_dict"]) {
                const mapChild = map[key + "_dict"];
                const out = {};
                for (const keyChild in v) {
                  out[keyChild] = transformObjectFields(v[keyChild], mapChild);
                }
                v = out;
              }
            }
          }
          ret[mapped] = v;
        }
      }
    }
  }
  return ret;
}
var invertedMaps = /* @__PURE__ */ new WeakMap();
function invertFieldMap(obj) {
  const existing = invertedMaps.get(obj);
  if (existing)
    return existing;
  const target = {};
  for (const key in obj) {
    const val = obj[key];
    if (key === "_dict") {
      target[key] = invertFieldMap(val);
    } else if (key.endsWith("_obj") || key.endsWith("_dict") || key.endsWith("_arr") || key.endsWith("_val")) {
      const keyMapped = obj[key.replace(/_obj|_dict|_arr|_val$/, "")];
      const suffix = key.match(/_obj|_dict|_arr|_val$/)[0];
      target[keyMapped + suffix] = invertFieldMap(val);
    } else if (typeof val === "string") {
      target[val] = key;
    }
  }
  invertedMaps.set(obj, target);
  return target;
}
if (process.env.NODE_ENV === "development") {
  validateMap = function(record) {
    const values = Object.values(record).filter((value) => {
      if (isObject(value)) {
        validateMap(value);
      } else {
        return isString(value);
      }
    });
    const uniques = Array.from(new Set(values));
    if (values.length !== uniques.length) {
      console.error("Field transform map has duplicate values", record, values.length, uniques.length);
    }
    return record;
  };
}

// src/is.ts
function isMap(obj) {
  return obj instanceof Map || obj instanceof WeakMap;
}
var globalState = {
  pendingNodes: /* @__PURE__ */ new Map(),
  dirtyNodes: /* @__PURE__ */ new Set()
};
function replacer(key, value) {
  if (isMap(value)) {
    return {
      __LSType: "Map",
      value: Array.from(value.entries())
      // or with spread: value: [...value]
    };
  } else if (value instanceof Set) {
    return {
      __LSType: "Set",
      value: Array.from(value)
      // or with spread: value: [...value]
    };
  } else if (globalState.replacer) {
    value = globalState.replacer(key, value);
  }
  return value;
}
var ISO8601 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;
function reviver(key, value) {
  if (value) {
    if (typeof value === "string" && ISO8601.test(value)) {
      return new Date(value);
    }
    if (typeof value === "object") {
      if (value.__LSType === "Map") {
        return new Map(value.value);
      } else if (value.__LSType === "Set") {
        return new Set(value.value);
      }
    }
    if (globalState.reviver) {
      value = globalState.reviver(key, value);
    }
  }
  return value;
}
function safeStringify(value) {
  return value ? JSON.stringify(value, replacer) : value;
}
function safeParse(value) {
  return value ? JSON.parse(value, reviver) : value;
}
function clone(value) {
  return safeParse(safeStringify(value));
}

// src/sync-plugins/firebase.ts
var isEnabled$ = observable(true);
var firebaseConfig = {};
function configureSyncedFirebase(config) {
  const { enabled, ...rest } = config;
  Object.assign(firebaseConfig, rest);
  if (enabled !== void 0) {
    isEnabled$.set(enabled);
  }
}
function joinPaths(str1, str2) {
  return str2 ? [str1, str2].join("/").replace(/\/\//g, "/") : str1;
}
var fns = {
  isInitialized: () => {
    try {
      return !!getAuth().app;
    } catch (e) {
      return false;
    }
  },
  getCurrentUser: () => {
    var _a;
    return (_a = getAuth().currentUser) == null ? void 0 : _a.uid;
  },
  ref: (path) => ref(getDatabase(), path),
  orderByChild: (ref, child, start) => query(ref, orderByChild(child), startAt(start)),
  update: (ref, object) => update(ref, object),
  once: (ref, callback, callbackError) => {
    let unsubscribe;
    const cb = (snap) => {
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = void 0;
      }
      callback(snap);
    };
    unsubscribe = onValue(ref, cb, callbackError);
    return unsubscribe;
  },
  onChildAdded,
  onChildChanged,
  onChildRemoved,
  onValue,
  serverTimestamp,
  remove: remove,
  onAuthStateChanged: (cb) => getAuth().onAuthStateChanged(cb),
  generateId: () => push(ref(getDatabase())).key
};
function syncedFirebase(props) {
  props = { ...firebaseConfig, ...props };
  let didList = false;
  const {
    refPath,
    query,
    fieldId,
    realtime,
    requireAuth,
    readonly,
    transform: transformProp,
    fieldTransforms,
    waitFor,
    waitForSet,
    ...rest
  } = props;
  const { fieldCreatedAt, changesSince } = props;
  const asType = props.as || "value";
  const fieldUpdatedAt = props.fieldUpdatedAt || "@";
  const isRealtime = realtime !== false;
  const pendingWrites = /* @__PURE__ */ new Map();
  const enqueuePendingWrite = (key) => {
    let resolveFn;
    let rejectFn;
    const promise = new Promise((resolve, reject) => {
      resolveFn = resolve;
      rejectFn = reject;
    });
    const entry = {
      resolve: resolveFn,
      reject: rejectFn
    };
    const state = pendingWrites.get(key);
    if (state) {
      state.waiting.push(entry);
      state.pendingCount += 1;
    } else {
      pendingWrites.set(key, {
        waiting: [entry],
        ready: [],
        pendingCount: 1
      });
    }
    return { promise, entry };
  };
  const flushPending = (key) => {
    const state = pendingWrites.get(key);
    if (!state) {
      return;
    }
    if (state.pendingCount === 0 && state.staged) {
      const { value, apply } = state.staged;
      state.staged = void 0;
      while (state.ready.length) {
        const entry = state.ready.shift();
        entry.resolve(value);
      }
      if (!state.waiting.length && !state.ready.length) {
        pendingWrites.delete(key);
      }
      apply == null ? void 0 : apply(value);
    }
  };
  const resolvePendingWrite = (key, entry) => {
    const state = pendingWrites.get(key);
    if (!state) {
      return;
    }
    const waitingIndex = state.waiting.indexOf(entry);
    if (waitingIndex >= 0) {
      state.waiting.splice(waitingIndex, 1);
      state.pendingCount = Math.max(0, state.pendingCount - 1);
    }
    state.ready.push(entry);
    flushPending(key);
  };
  const rejectPendingWrite = (key, entry, error) => {
    const state = pendingWrites.get(key);
    if (state) {
      const waitingIndex = state.waiting.indexOf(entry);
      if (waitingIndex >= 0) {
        state.waiting.splice(waitingIndex, 1);
        state.pendingCount = Math.max(0, state.pendingCount - 1);
      } else {
        const readyIndex = state.ready.indexOf(entry);
        if (readyIndex >= 0) {
          state.ready.splice(readyIndex, 1);
        }
      }
      if (!state.waiting.length && !state.ready.length) {
        pendingWrites.delete(key);
      }
    }
    entry.reject(error);
  };
  const handleServerValue = (key, value, apply) => {
    var _a;
    const state = pendingWrites.get(key);
    if (!state || !state.waiting.length && !state.ready.length) {
      pendingWrites.delete(key);
      apply == null ? void 0 : apply(value);
    } else {
      state.staged = {
        value: value && typeof value === "object" ? clone(value) : value,
        apply: apply != null ? apply : (_a = state.staged) == null ? void 0 : _a.apply
      };
      flushPending(key);
    }
  };
  const ensureFieldId = (key, value) => {
    if (fieldId && key && value && typeof value === "object" && !value[fieldId]) {
      value[fieldId] = key;
    }
    return value;
  };
  const computeRef = (lastSync) => {
    const pathFirebase = refPath(fns.getCurrentUser());
    let ref = fns.ref(pathFirebase);
    if (query) {
      ref = query(ref);
    }
    if (changesSince === "last-sync" && lastSync && fieldUpdatedAt && isNumber(lastSync)) {
      ref = fns.orderByChild(ref, fieldUpdatedAt, lastSync + 1);
    }
    return ref;
  };
  const list = async (getParams) => {
    const { lastSync, onError } = getParams;
    const ref = computeRef(lastSync);
    return new Promise((resolve) => {
      fns.once(
        ref,
        async (snap) => {
          const val = snap.val();
          let values = [];
          if (!isNullOrUndefined(val)) {
            values = asType === "value" ? [val] : Object.entries(val).map(([key, value]) => {
              return ensureFieldId(key, value);
            });
          }
          didList = true;
          resolve(values);
        },
        (error) => onError(error, { source: "list", type: "get", retry: getParams })
      );
    });
  };
  const subscribe = isRealtime ? ({ lastSync, update: update2, onError }) => {
    const ref = computeRef(lastSync);
    let unsubscribes;
    if (asType === "value") {
      const onValue2 = (snap) => {
        if (!didList)
          return;
        const val = snap.val();
        handleServerValue("", val, (resolvedValue) => {
          update2({
            value: [resolvedValue],
            mode: "set"
          });
        });
      };
      unsubscribes = [fns.onValue(ref, onValue2, onError)];
    } else {
      const onChildChange = (snap) => {
        if (!didList)
          return;
        const key = snap.key;
        const val = ensureFieldId(key, snap.val());
        handleServerValue(key, val, (resolvedValue) => {
          update2({
            value: [resolvedValue],
            mode: "merge"
          });
        });
      };
      const onChildDelete = (snap) => {
        if (!didList)
          return;
        const key = snap.key;
        const valueRaw = snap.val();
        const valueWithId = ensureFieldId(key, isNullOrUndefined(valueRaw) ? {} : valueRaw);
        valueWithId[symbolDelete] = true;
        handleServerValue(key, valueWithId, (resolvedValue) => {
          update2({
            value: [resolvedValue],
            mode: "merge"
          });
        });
      };
      unsubscribes = [
        fns.onChildAdded(ref, onChildChange, onError),
        fns.onChildChanged(ref, onChildChange, onError),
        fns.onChildRemoved(ref, onChildDelete, onError)
      ];
    }
    return () => {
      unsubscribes.forEach((fn) => fn());
    };
  } : void 0;
  const addUpdatedAt = (input) => {
    if (fieldUpdatedAt) {
      input[fieldUpdatedAt] = serverTimestamp();
    }
  };
  const addCreatedAt = (input) => {
    if (fieldCreatedAt && !input[fieldCreatedAt]) {
      input[fieldCreatedAt] = serverTimestamp();
    }
    return addUpdatedAt(input);
  };
  const upsert = (input, params) => {
    const id = fieldId && asType !== "value" ? input[fieldId] : "";
    const pendingKey = fieldId && asType !== "value" ? String(id != null ? id : "") : "";
    const { promise, entry } = enqueuePendingWrite(pendingKey);
    const userId = fns.getCurrentUser();
    const basePath = refPath(userId);
    const childPath = fieldId && asType !== "value" ? pendingKey : "";
    const path = joinPaths(basePath, childPath);
    const ref = fns.ref(path);
    const updatePromise = fns.update(ref, input);
    updatePromise.then(() => {
      resolvePendingWrite(pendingKey, entry);
    }).catch((error) => {
      rejectPendingWrite(pendingKey, entry, error);
    });
    if (!isRealtime) {
      updatePromise.then(() => {
        const onceRef = fieldId && asType !== "value" ? ref : fns.ref(basePath);
        fns.once(
          onceRef,
          (snap) => {
            const rawValue = snap.val();
            const value = fieldId && asType !== "value" ? ensureFieldId(pendingKey, isNullOrUndefined(rawValue) ? {} : rawValue) : rawValue;
            handleServerValue(pendingKey, value, (resolvedValue) => {
              params.update({
                value: resolvedValue,
                mode: "merge"
              });
            });
          },
          (error) => {
            rejectPendingWrite(pendingKey, entry, error);
          }
        );
      }).catch(() => {
      });
    }
    return promise;
  };
  const create = readonly ? void 0 : (input, params) => {
    addCreatedAt(input);
    return upsert(input, params);
  };
  const update = readonly ? void 0 : (input, params) => {
    addUpdatedAt(input);
    return upsert(input, params);
  };
  const deleteFn = readonly ? void 0 : (input) => {
    const path = joinPaths(
      refPath(fns.getCurrentUser()),
      fieldId && asType !== "value" ? input[fieldId] : ""
    );
    return fns.remove(fns.ref(path));
  };
  let isAuthedIfRequired$;
  if (requireAuth) {
    if (fns.isInitialized()) {
      isAuthedIfRequired$ = observable(false);
      fns.onAuthStateChanged((user) => {
        isAuthedIfRequired$.set(!!user);
      });
    }
  }
  let transform = transformProp;
  if (fieldTransforms) {
    const inverted = invertFieldMap(fieldTransforms);
    transform = {
      load(value, method) {
        const fieldTransformed = transformObjectFields(value, inverted);
        return (transformProp == null ? void 0 : transformProp.load) ? transformProp.load(fieldTransformed, method) : fieldTransformed;
      },
      save(value) {
        const transformed = (transformProp == null ? void 0 : transformProp.save) ? transformProp.save(value) : value;
        if (isPromise(transformed)) {
          return transformed.then((transformedValue) => {
            return transformObjectFields(transformedValue, fieldTransforms);
          });
        } else {
          return transformObjectFields(transformed, fieldTransforms);
        }
      }
    };
  }
  return syncedCrud({
    ...rest,
    // Workaround for type errors
    list,
    subscribe,
    create,
    update,
    delete: deleteFn,
    waitFor: () => isEnabled$.get() && (isAuthedIfRequired$ ? isAuthedIfRequired$.get() : true) && (waitFor ? computeSelector(waitFor) : true),
    waitForSet: (params) => isEnabled$.get() && (isAuthedIfRequired$ ? isAuthedIfRequired$.get() : true) && (waitForSet ? isFunction(waitForSet) ? waitForSet(params) : waitForSet : true),
    generateId: fns.generateId,
    transform,
    as: asType
  });
}

export { configureSyncedFirebase, invertFieldMap, syncedFirebase, transformObjectFields };
