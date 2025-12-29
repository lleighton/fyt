import { useObservable } from '@legendapp/state/react';
import { syncedQuery } from '@legendapp/state/sync-plugins/tanstack-query';
import { useQueryClient } from '@tanstack/react-query';

// src/sync-plugins/tanstack-react-query.ts
function useObservableSyncedQuery(params) {
  const queryClient = params.queryClient || useQueryClient();
  return useObservable(
    syncedQuery({
      ...params,
      queryClient
    })
  );
}

export { useObservableSyncedQuery };
