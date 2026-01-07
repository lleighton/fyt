import { isPromise, isNullOrUndefined, applyChanges, setAtPath, symbolDelete, isArray, internal, getNodeValue } from '@legendapp/state';
import { synced, deepEqual, internal as internal$1, diffObjects } from '@legendapp/state/sync';

// src/sync-plugins/crud.ts
var { clone, getKeys, setNodeValue, getChildNode } = internal;
var { waitForSet, runWithRetry } = internal$1;
function transformOut(data, transform) {
  return transform ? transform(clone(data)) : data;
}
function ensureId(obj, fieldId, generateId, node) {
  if (!obj[fieldId]) {
    obj[fieldId] = generateId();
    if (node) {
      setNodeValue(node, obj);
    }
  }
}
function computeLastSync(data, fieldUpdatedAt, fieldCreatedAt) {
  let newLastSync = 0;
  for (let i = 0; i < data.length; i++) {
    const updated = (fieldUpdatedAt ? data[i][fieldUpdatedAt] : 0) || (fieldCreatedAt ? data[i][fieldCreatedAt] : 0);
    if (updated) {
      newLastSync = Math.max(newLastSync, +new Date(updated));
    }
  }
  return newLastSync;
}
function arrayToRecord(arr, keyField) {
  const record = {};
  if (arr == null ? void 0 : arr.length) {
    for (let i = 0; i < arr.length; i++) {
      const v = arr[i];
      const key = v[keyField];
      record[key] = v;
    }
  }
  return record;
}
function retrySet(params, retry, action, itemKey, itemValue, change, queuedRetries, itemValueFull, actionFn, saveResult) {
  if (action === "delete") {
    if (queuedRetries.create.has(itemKey)) {
      queuedRetries.create.delete(itemKey);
    }
    if (queuedRetries.update.has(itemKey)) {
      queuedRetries.update.delete(itemKey);
    }
  } else {
    if (queuedRetries.delete.has(itemKey)) {
      queuedRetries.delete.delete(itemKey);
    }
  }
  const queuedRetry = queuedRetries[action].get(itemKey);
  if (queuedRetry) {
    itemValue = Object.assign(queuedRetry, itemValue);
  }
  queuedRetries[action].set(itemKey, itemValue);
  const clonedValue = clone(itemValueFull);
  const paramsWithChanges = { ...params, changes: [change] };
  return runWithRetry(
    paramsWithChanges,
    retry,
    "create_" + itemKey,
    () => actionFn(itemValue, paramsWithChanges).then((result) => {
      queuedRetries[action].delete(itemKey);
      return saveResult(itemKey, clonedValue, result, true, change);
    })
  );
}
function syncedCrud(props) {
  const {
    get: getFn,
    list: listFn,
    create: createFn,
    update: updateFn,
    delete: deleteFn,
    transform,
    fieldId: fieldIdProp,
    fieldCreatedAt,
    fieldUpdatedAt,
    fieldDeleted,
    fieldDeletedList,
    updatePartial,
    subscribe: subscribeProp,
    onSaved,
    mode: modeParam,
    changesSince,
    generateId,
    waitForSet: waitForSetParam,
    retry,
    ...rest
  } = props;
  const fieldId = fieldIdProp || "id";
  const pendingCreates = /* @__PURE__ */ new Set();
  const queuedRetries = {
    create: /* @__PURE__ */ new Map(),
    update: /* @__PURE__ */ new Map(),
    delete: /* @__PURE__ */ new Map()
  };
  let asType = props.as;
  if (!asType) {
    asType = getFn ? "value" : "object";
  }
  const asMap = asType === "Map";
  const asArray = asType === "array";
  const resultsToOutType = (results) => {
    if (asType === "value") {
      return results[0];
    }
    const out = asType === "array" ? [] : asMap ? /* @__PURE__ */ new Map() : {};
    for (let i = 0; i < results.length; i++) {
      let result = results[i];
      const value = result;
      if (value) {
        result = fieldDeleted && result[fieldDeleted] || fieldDeletedList && result[fieldDeletedList] || result[symbolDelete] ? internal.symbolDelete : result;
        if (asArray) {
          out.push(result);
        } else if (asMap) {
          out.set(value[fieldId], result);
        } else {
          out[value[fieldId]] = result;
        }
      }
    }
    return out;
  };
  const transformRows = (data) => {
    return data.length ? Promise.all(
      data.map(
        (value) => (
          // Skip transforming any children with symbolDelete or fieldDeleted because they'll get deleted by resultsToOutType
          value[symbolDelete] || fieldDeleted && value[fieldDeleted] || fieldDeletedList && value[fieldDeletedList] ? value : transform.load(value, "get")
        )
      )
    ) : [];
  };
  const get = getFn || listFn ? (getParams) => {
    return runWithRetry(getParams, retry, getFn || listFn, () => {
      const { updateLastSync, lastSync, value } = getParams;
      if (listFn) {
        const isLastSyncMode = changesSince === "last-sync";
        if (isLastSyncMode && lastSync) {
          getParams.mode = modeParam || (asType === "array" ? "append" : asType === "value" ? "set" : "assign");
        }
        const listPromise = listFn(getParams);
        const toOut = (transformed) => {
          if (asType === "value") {
            if (transformed.length > 0) {
              return transformed[0];
            } else {
              return value ? void 0 : null;
            }
          } else {
            return resultsToOutType(transformed);
          }
        };
        const processResults = (data) => {
          data || (data = []);
          if (fieldUpdatedAt) {
            const newLastSync = computeLastSync(data, fieldUpdatedAt, fieldCreatedAt);
            if (newLastSync && newLastSync !== lastSync) {
              updateLastSync(newLastSync);
            }
          }
          let transformed = data;
          if (transform == null ? void 0 : transform.load) {
            transformed = transformRows(data);
          }
          return isPromise(transformed) ? transformed.then(toOut) : toOut(transformed);
        };
        return isPromise(listPromise) ? listPromise.then(processResults) : processResults(listPromise);
      } else if (getFn) {
        const dataPromise = getFn(getParams);
        const processData = (data) => {
          let transformed = data;
          if (data) {
            const newLastSync = data[fieldUpdatedAt] || data[fieldCreatedAt];
            if (newLastSync && newLastSync !== lastSync) {
              updateLastSync(newLastSync);
            }
            if (transform == null ? void 0 : transform.load) {
              transformed = transform.load(data, "get");
            }
          }
          return transformed;
        };
        return isPromise(dataPromise) ? dataPromise.then(processData) : processData(dataPromise);
      }
    });
  } : void 0;
  const set = createFn || updateFn || deleteFn ? async (params) => {
    const { value, changes, update, retryAsCreate, node } = params;
    const creates = /* @__PURE__ */ new Map();
    const updates = /* @__PURE__ */ new Map();
    const updateFullValues = /* @__PURE__ */ new Map();
    const deletes = /* @__PURE__ */ new Set();
    const changesById = /* @__PURE__ */ new Map();
    const getUpdateValue = (itemValue, prev) => {
      return updatePartial ? Object.assign(
        diffObjects(
          prev,
          itemValue,
          /*deep*/
          true
        ),
        !isNullOrUndefined(itemValue[fieldId]) ? { [fieldId]: itemValue[fieldId] } : {}
      ) : itemValue;
    };
    changes.forEach((change) => {
      var _a, _b;
      const { path, prevAtPath, valueAtPath, pathTypes } = change;
      if (asType === "value") {
        if (value) {
          let isCreate = fieldCreatedAt ? !value[fieldCreatedAt] : !prevAtPath;
          if (isNullOrUndefined(value[fieldId]) && generateId) {
            ensureId(value, fieldId, generateId, node);
          }
          const id = value[fieldId];
          if (!isNullOrUndefined(id)) {
            changesById.set(id, change);
            if (pendingCreates.has(id)) {
              isCreate = false;
            }
            if (isCreate || retryAsCreate) {
              if (createFn) {
                creates.set(id, value);
              } else {
                console.warn("[legend-state] missing create function");
              }
            } else if (path.length === 0) {
              if (valueAtPath) {
                updates.set(id, getUpdateValue(valueAtPath, prevAtPath));
                updateFullValues.set(id, valueAtPath);
              } else if (prevAtPath) {
                deletes.add(prevAtPath);
              }
            } else if (!updates.has(id)) {
              const previous = applyChanges(
                clone(value),
                changes,
                /*applyPrevious*/
                true
              );
              updates.set(id, getUpdateValue(value, previous));
              updateFullValues.set(id, value);
            }
          } else {
            console.error("[legend-state]: added synced item without an id");
          }
        } else if (path.length === 0) {
          deletes.add(prevAtPath);
          changesById.set(prevAtPath[fieldId], change);
        }
      } else {
        let itemsChanged = [];
        if (path.length === 0) {
          if (asArray && generateId) {
            for (let i = 0; i < valueAtPath.length; i++) {
              const value2 = valueAtPath[i];
              if (value2 && !value2[fieldId]) {
                ensureId(value2, fieldId, generateId, getChildNode(node, i + ""));
              }
            }
          }
          const valueAsObject = asArray ? arrayToRecord(valueAtPath, fieldId) : valueAtPath;
          const prevAsObject = asArray ? arrayToRecord(prevAtPath, fieldId) : prevAtPath;
          const keys = getKeys(valueAsObject, false, asMap, false);
          const keysPrev = getKeys(prevAsObject, false, asMap, false);
          const keysSet = new Set(keys);
          const length = ((_a = keys || valueAsObject) == null ? void 0 : _a.length) || 0;
          const lengthPrev = ((_b = keysPrev || prevAsObject) == null ? void 0 : _b.length) || 0;
          for (let i = 0; i < lengthPrev; i++) {
            const key = keysPrev[i];
            if (!keysSet.has(key)) {
              deletes.add(prevAsObject[key]);
            }
          }
          for (let i = 0; i < length; i++) {
            const key = keys[i];
            const value2 = asMap ? valueAsObject.get(key) : valueAsObject[key];
            const prev = prevAsObject ? asMap ? prevAsObject.get(key) : prevAsObject[key] : void 0;
            if (isNullOrUndefined(value2) && !isNullOrUndefined(prev)) {
              deletes.add(prev);
              return false;
            } else {
              const isDiff = !prevAsObject || !deepEqual(value2, prev);
              if (isDiff) {
                itemsChanged.push([getUpdateValue(value2, prev), prev, value2]);
              }
            }
          }
        } else {
          const itemKey = path[0];
          const itemValue = asMap ? value.get(itemKey) : value[itemKey];
          if (!itemValue) {
            if (path.length === 1 && prevAtPath) {
              deletes.add(prevAtPath);
              changesById.set(prevAtPath[fieldId], change);
            }
          } else {
            if (generateId) {
              ensureId(itemValue, fieldId, generateId, getChildNode(node, itemKey + ""));
            }
            const previous = setAtPath(
              clone(itemValue),
              path.slice(1),
              pathTypes.slice(1),
              prevAtPath
            );
            itemsChanged = [[getUpdateValue(itemValue, previous), previous, itemValue]];
          }
        }
        itemsChanged == null ? void 0 : itemsChanged.forEach(([item, prev, fullValue]) => {
          const isCreate = !pendingCreates.has(item[fieldId]) && (fieldCreatedAt ? !item[fieldCreatedAt] && !(prev == null ? void 0 : prev[fieldCreatedAt]) : fieldUpdatedAt ? !item[fieldUpdatedAt] && !(prev == null ? void 0 : prev[fieldCreatedAt]) : isNullOrUndefined(prev));
          if (isCreate) {
            if (!item[fieldId]) {
              console.error("[legend-state]: added item without an id");
            }
            if (createFn) {
              const id = item[fieldId];
              changesById.set(id, change);
              pendingCreates.add(id);
              creates.set(id, item);
            } else {
              console.warn("[legend-state] missing create function");
            }
          } else {
            if (updateFn) {
              const id = item[fieldId];
              changesById.set(id, change);
              updates.set(id, updates.has(id) ? Object.assign(updates.get(id), item) : item);
              updateFullValues.set(
                id,
                updateFullValues.has(id) ? Object.assign(updateFullValues.get(id), fullValue) : fullValue
              );
            } else {
              console.warn("[legend-state] missing update function");
            }
          }
        });
      }
    });
    const saveResult = async (itemKey, input, data, isCreate, change) => {
      var _a;
      if (data) {
        let saved = (transform == null ? void 0 : transform.load) ? await transform.load(data, "set") : data;
        const isChild = itemKey !== "undefined" && asType !== "value";
        const currentPeeked = getNodeValue(node);
        const currentValue = isChild ? (_a = asType === "array" && isArray(currentPeeked) ? currentPeeked.find((v) => v[fieldId] === itemKey) : void 0) != null ? _a : asType === "Map" ? currentPeeked.get(itemKey) : currentPeeked[itemKey] : currentPeeked;
        if (saved && !isNullOrUndefined(currentValue)) {
          if (onSaved) {
            const ret = onSaved({
              saved,
              input,
              currentValue,
              isCreate,
              props
            });
            if (ret) {
              saved = ret;
            }
          }
          saved = clone(saved);
          Object.keys(saved).forEach((key) => {
            const i = input[key];
            const c = currentValue[key];
            if (
              // value is already the new value, can ignore
              saved[key] === c || // user has changed local value
              key !== fieldId && i !== void 0 && i !== c
            ) {
              delete saved[key];
            }
          });
          let value2;
          if (asType === "array") {
            const index = currentPeeked.findIndex(
              (cur) => cur[fieldId] === itemKey
            );
            if (index < 0) {
              console.warn("[legend-state] Item saved that does not exist in array", saved);
            } else {
              value2 = { [index < 0 ? 0 : index]: saved };
            }
          } else {
            value2 = itemKey !== "undefined" && asType !== "value" ? { [itemKey]: saved } : saved;
          }
          if (value2 !== void 0) {
            update({
              value: value2,
              mode: "merge",
              changes: [change]
            });
          }
        }
      }
    };
    return Promise.all([
      // Handle creates
      ...Array.from(creates).map(async ([itemKey, itemValue]) => {
        if (waitForSetParam) {
          await waitForSet(waitForSetParam, changes, itemValue, { type: "create" });
        }
        const createObj = await transformOut(itemValue, transform == null ? void 0 : transform.save);
        return retrySet(
          params,
          retry,
          "create",
          itemKey,
          createObj,
          changesById.get(itemKey),
          queuedRetries,
          createObj,
          createFn,
          saveResult
        ).then(() => {
          pendingCreates.delete(itemKey);
        });
      }),
      // Handle updates
      ...Array.from(updates).map(async ([itemKey, itemValue]) => {
        const fullValue = updateFullValues.get(itemKey);
        if (waitForSetParam) {
          await waitForSet(waitForSetParam, changes, fullValue, { type: "update" });
        }
        const changed = await transformOut(itemValue, transform == null ? void 0 : transform.save);
        const fullValueTransformed = await transformOut(
          fullValue,
          transform == null ? void 0 : transform.save
        );
        if (Object.keys(changed).length > 0) {
          return retrySet(
            params,
            retry,
            "update",
            itemKey,
            changed,
            changesById.get(itemKey),
            queuedRetries,
            fullValueTransformed,
            updateFn,
            saveResult
          );
        }
      }),
      // Handle deletes
      ...Array.from(deletes).filter((val) => val !== symbolDelete).map(async (valuePrevious) => {
        if (waitForSetParam) {
          await waitForSet(waitForSetParam, changes, valuePrevious, { type: "delete" });
        }
        const itemKey = valuePrevious[fieldId];
        if (!itemKey) {
          console.error("[legend-state]: deleting item without an id");
          return;
        }
        if (deleteFn) {
          return retrySet(
            params,
            retry,
            "delete",
            itemKey,
            valuePrevious,
            changesById.get(itemKey),
            queuedRetries,
            valuePrevious,
            deleteFn,
            saveResult
          );
        }
        if (fieldDeleted && updateFn) {
          const value2 = { [fieldId]: itemKey, [fieldDeleted]: true };
          return retrySet(
            params,
            retry,
            "delete",
            itemKey,
            value2,
            changesById.get(itemKey),
            queuedRetries,
            value2,
            updateFn,
            saveResult
          );
        }
        console.warn("[legend-state] missing delete function");
      })
    ]);
  } : void 0;
  const subscribe = subscribeProp ? (params) => subscribeProp({
    ...params,
    update: async (paramsUpdate) => {
      const paramsForUpdate = paramsUpdate;
      const rows = paramsUpdate.value;
      if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
        if (!isArray(rows)) {
          console.error("[legend-state] subscribe:update expects an array of changed items");
        }
      }
      const newLastSync = computeLastSync(rows, fieldUpdatedAt, fieldCreatedAt);
      if (newLastSync) {
        paramsForUpdate.lastSync = newLastSync;
      }
      const rowsTransformed = (transform == null ? void 0 : transform.load) ? await transformRows(rows) : rows;
      paramsForUpdate.value = resultsToOutType(rowsTransformed);
      params.update(paramsForUpdate);
    }
  }) : void 0;
  return synced({
    set,
    get,
    subscribe,
    mode: modeParam,
    ...rest
  });
}

export { syncedCrud };
