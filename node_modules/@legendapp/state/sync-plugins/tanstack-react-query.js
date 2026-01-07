'use strict';

var react = require('@legendapp/state/react');
var tanstackQuery = require('@legendapp/state/sync-plugins/tanstack-query');
var reactQuery = require('@tanstack/react-query');

// src/sync-plugins/tanstack-react-query.ts
function useObservableSyncedQuery(params) {
  const queryClient = params.queryClient || reactQuery.useQueryClient();
  return react.useObservable(
    tanstackQuery.syncedQuery({
      ...params,
      queryClient
    })
  );
}

exports.useObservableSyncedQuery = useObservableSyncedQuery;
