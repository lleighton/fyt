'use strict';

var state = require('@legendapp/state');
var sync = require('@legendapp/state/sync');
var crud = require('@legendapp/state/sync-plugins/crud');

// src/sync-plugins/keel.ts
var KeelKeys = ["createdAt", "updatedAt"];
var modifiedClients = /* @__PURE__ */ new WeakSet();
var isAuthed$ = state.observable(false);
var isAuthing$ = state.observable(false);
async function ensureAuthToken(props, force) {
  if (!force && isAuthed$.get()) {
    return true;
  }
  const { client, refreshAuth } = props;
  let isAuthed = await client.auth.isAuthenticated().then(({ data }) => data);
  if (!isAuthed) {
    if (!force && isAuthing$.get()) {
      return state.when(
        () => !isAuthing$.get(),
        () => isAuthed$.get()
      );
    }
    isAuthing$.set(true);
    if (refreshAuth) {
      await refreshAuth();
    }
    isAuthed = await client.auth.isAuthenticated().then(({ data }) => data);
    if (!isAuthed) {
      isAuthed = await client.auth.refresh().then(({ data }) => data);
    }
  }
  if (isAuthed) {
    state.batch(() => {
      isAuthed$.set(true);
      isAuthing$.set(false);
    });
  } else {
    setTimeout(() => ensureAuthToken(
      props,
      /*force*/
      true
    ), 1e3);
  }
  return isAuthed;
}
async function handleApiError(props, error) {
  var _a;
  if (error.type === "unauthorized" || error.type === "forbidden") {
    console.warn("Keel token expired, refreshing...");
    isAuthed$.set(false);
    await ensureAuthToken(props);
    return true;
  } else if (((_a = error.error) == null ? void 0 : _a.message) === "Failed to fetch") {
    throw error.error;
  }
  return false;
}
function convertObjectToCreate(item) {
  const cloned = {};
  Object.keys(item).forEach((key) => {
    if (key.endsWith("Id")) {
      if (item[key]) {
        cloned[key.slice(0, -2)] = { id: item[key] };
      }
    } else if (key !== "createdAt" && key !== "updatedAt") {
      if (item[key] === void 0) {
        cloned[key] = null;
      } else {
        cloned[key] = item[key];
      }
    }
  });
  return cloned;
}
var realtimeState = { current: {} };
function setupRealtime(props) {
  const { client } = props;
  if (client && !modifiedClients.has(client)) {
    modifiedClients.add(client);
    const originalRawRequest = client.client.rawRequest;
    client.client.rawRequest = (action, body) => {
      if (action.startsWith("list")) {
        realtimeState.current = {
          lastAction: action,
          lastParams: body
        };
      }
      return originalRawRequest(action, body);
    };
  }
}
var NumPerPage = 200;
async function getAllPages(props, listFn, params, listParams, onError) {
  const allData = [];
  let pageInfo = void 0;
  const { first: firstParam } = params;
  do {
    const first = firstParam ? Math.min(firstParam - allData.length, NumPerPage) : NumPerPage;
    if (first < 1) {
      break;
    }
    const pageEndCursor = pageInfo == null ? void 0 : pageInfo.endCursor;
    const paramsWithCursor = pageEndCursor ? { first, ...params, after: pageEndCursor } : { first, ...params };
    pageInfo = void 0;
    const ret = await listFn(paramsWithCursor);
    if (ret) {
      const { data, error } = ret;
      if (error) {
        const handled = await handleApiError(props, error);
        if (!handled) {
          const err = new Error(error.message, { cause: { error } });
          onError(err, {
            getParams: listParams,
            type: "get",
            source: "list",
            action: listFn.name || listFn.toString(),
            retry: listParams
          });
        }
      } else if (data) {
        pageInfo = data.pageInfo;
        allData.push(...data.results);
      }
    }
  } while (pageInfo == null ? void 0 : pageInfo.hasNextPage);
  return allData;
}
function syncedKeel(props) {
  const {
    get: getParam,
    list: listParam,
    create: createParam,
    update: updateParam,
    delete: deleteParam,
    subscribe: subscribeParam,
    first,
    where: whereParam,
    waitFor,
    waitForSet,
    fieldDeleted,
    realtime,
    mode,
    requireAuth = true,
    ...rest
  } = props;
  const { changesSince } = props;
  const asType = getParam ? "value" : props.as;
  let subscribeFn;
  const subscribeFnKey$ = state.observable("");
  const fieldCreatedAt = "createdAt";
  const fieldUpdatedAt = "updatedAt";
  const setupSubscribe = realtime ? async (getParams) => {
    const { lastAction, lastParams } = realtimeState.current;
    const { path, plugin } = realtime;
    if (lastAction && path && plugin) {
      const key = await path(lastAction, lastParams);
      subscribeFn = () => realtime.plugin.subscribe(key, getParams);
      subscribeFnKey$.set(key);
    }
  } : void 0;
  const list = listParam ? async (listParams) => {
    const { lastSync, onError } = listParams;
    const queryBySync = !!lastSync && changesSince === "last-sync";
    const where = Object.assign(
      queryBySync ? { updatedAt: { after: new Date(lastSync + 1) } } : {},
      state.isFunction(whereParam) ? whereParam() : whereParam
    );
    const params = { where, first };
    realtimeState.current = {};
    const promise = getAllPages(props, listParam, params, listParams, onError);
    if (realtime) {
      setupSubscribe(listParams);
    }
    return promise;
  } : void 0;
  const get = getParam ? async (getParams) => {
    const { refresh, onError } = getParams;
    realtimeState.current = {};
    const promise = getParam({ refresh });
    if (realtime) {
      setupSubscribe(getParams);
    }
    const { data, error } = await promise;
    if (error) {
      const handled = await handleApiError(props, error);
      if (!handled) {
        const err = new Error(error.message, { cause: { error } });
        onError(err, {
          getParams,
          type: "get",
          source: "get",
          action: getParam.name || getParam.toString(),
          retry: getParams
        });
      }
    } else {
      return data;
    }
  } : void 0;
  const onSaved = ({ saved }) => {
    if (saved) {
      if (realtime == null ? void 0 : realtime.plugin) {
        const subscribeFnKey = subscribeFnKey$.get();
        if (subscribeFnKey) {
          realtime == null ? void 0 : realtime.plugin.setSaved(subscribeFnKey);
        }
      }
    }
  };
  const handleSetError = async (error, params, input, fn, from) => {
    var _a, _b;
    const { update: update2, onError } = params;
    if (from === "create" && ((_a = error.message) == null ? void 0 : _a.includes("for the unique")) && ((_b = error.message) == null ? void 0 : _b.includes("must be unique"))) {
      if (__DEV__) {
        console.log("Creating duplicate data already saved, just ignore.");
      }
      params.cancelRetry = true;
      update2({
        value: {},
        mode: "assign"
      });
    } else if (from === "delete" && error.message === "record not found") {
      if (__DEV__) {
        console.log("Deleting non-existing data, just ignore.");
      }
      params.cancelRetry = true;
    } else {
      const handled = await handleApiError(props, error);
      if (!handled) {
        const err = new Error(error.message, { cause: { error } });
        onError(err, {
          setParams: params,
          input,
          type: "set",
          source: from,
          action: fn.name || fn.toString(),
          retry: params,
          revert: sync.createRevertChanges(params.value$, params.changes)
        });
      }
    }
  };
  const create = createParam ? async (input, params) => {
    const { data, error } = await createParam(convertObjectToCreate(input));
    if (error) {
      await handleSetError(error, params, input, createParam, "create");
    }
    return data;
  } : void 0;
  const update = updateParam ? async (input, params) => {
    const id = input.id;
    const values = convertObjectToCreate(input);
    delete values.id;
    if (!state.isEmpty(values)) {
      const { data, error } = await updateParam({ where: { id }, values });
      if (error) {
        await handleSetError(error, params, input, updateParam, "update");
      }
      return data;
    }
  } : void 0;
  const deleteFn = deleteParam ? async (value, params) => {
    const { data, error } = await deleteParam({ id: value.id });
    if (error) {
      await handleSetError(error, params, value, deleteParam, "delete");
    }
    return data;
  } : void 0;
  if (realtime) {
    setupRealtime(props);
  }
  const subscribe = realtime ? (params) => {
    let unsubscribe = void 0;
    state.when(subscribeFnKey$, () => {
      unsubscribe = subscribeFn(params);
    });
    const unsubscribeParam = subscribeParam == null ? void 0 : subscribeParam(params);
    return () => {
      unsubscribe == null ? void 0 : unsubscribe();
      unsubscribeParam == null ? void 0 : unsubscribeParam();
    };
  } : subscribeParam;
  return crud.syncedCrud({
    ...rest,
    // Workaround for type errors
    as: asType,
    mode: mode || "merge",
    list,
    create,
    update,
    delete: deleteFn,
    waitFor: () => {
      ensureAuthToken(props);
      return [requireAuth ? isAuthed$ : true, waitFor || true];
    },
    waitForSet: (params) => {
      ensureAuthToken(props);
      return [
        requireAuth ? isAuthed$ : true,
        () => waitForSet ? state.isFunction(waitForSet) ? waitForSet(params) : waitForSet : true
      ];
    },
    onSaved,
    fieldCreatedAt,
    fieldUpdatedAt,
    fieldDeleted,
    changesSince,
    updatePartial: true,
    subscribe,
    get
  });
}

exports.KeelKeys = KeelKeys;
exports.syncedKeel = syncedKeel;
