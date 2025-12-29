'use strict';

var state = require('@legendapp/state');
var sync = require('@legendapp/state/sync');
var queryCore = require('@tanstack/query-core');

// src/sync-plugins/tanstack-query.ts
var nextMutationKey = 0;
function syncedQuery(params) {
  const { query: options, mutation: mutationOptions, queryClient, initial: initialParam, ...rest } = params;
  if (initialParam !== void 0) {
    const initialValue = state.isFunction(initialParam) ? initialParam() : initialParam;
    options.initialData = initialValue;
  }
  const initial = options.initialData;
  const Observer = queryCore.QueryObserver;
  const defaultedOptions = queryClient.defaultQueryOptions(
    options
  );
  let observer = void 0;
  let latestOptions = defaultedOptions;
  let queryKeyFromFn;
  let resolveInitialPromise = void 0;
  const origQueryKey = options.queryKey;
  const isKeyFunction = state.isFunction(origQueryKey);
  const updateQueryOptions = (obj) => {
    const options2 = Object.assign({}, obj);
    if (isKeyFunction) {
      options2.queryKey = queryKeyFromFn;
    }
    latestOptions = options2;
    if (observer) {
      observer.setOptions(options2, { listeners: false });
    }
  };
  if (isKeyFunction) {
    state.observe(() => {
      queryKeyFromFn = origQueryKey();
      updateQueryOptions(latestOptions);
    });
  }
  observer = new Observer(queryClient, latestOptions);
  let isFirstRun = true;
  const get = async () => {
    if (isFirstRun) {
      isFirstRun = false;
      const result = observer.getOptimisticResult(latestOptions);
      if (result.isLoading) {
        await new Promise((resolve) => {
          resolveInitialPromise = resolve;
        });
      }
      return result.data;
    } else {
      return Promise.resolve(observer.refetch()).then((res) => res.data);
    }
  };
  const subscribe = ({ update }) => {
    const unsubscribe = observer.subscribe(
      queryCore.notifyManager.batchCalls((result) => {
        if (result.status === "success") {
          if (resolveInitialPromise) {
            resolveInitialPromise(result.data);
            resolveInitialPromise = void 0;
          }
          update({ value: result.data });
        }
      })
    );
    observer.updateResult();
    return unsubscribe;
  };
  let set = void 0;
  if (mutationOptions) {
    const options2 = {
      mutationKey: ["LS-mutation", nextMutationKey++],
      ...mutationOptions
    };
    const mutator = new queryCore.MutationObserver(queryClient, options2);
    set = ({ value }) => {
      const mutationCache = queryClient.getMutationCache();
      mutationCache.findAll({ mutationKey: options2.mutationKey }).forEach((mutation) => {
        mutationCache.remove(mutation);
      });
      return mutator.mutate(value);
    };
  }
  return sync.synced({
    get,
    set,
    subscribe,
    initial,
    ...rest
  });
}

exports.syncedQuery = syncedQuery;
