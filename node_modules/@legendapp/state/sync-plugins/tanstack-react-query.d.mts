import { SyncedQueryParams } from '@legendapp/state/sync-plugins/tanstack-query';
import { DefaultError, QueryKey, QueryClient } from '@tanstack/query-core';
import { Observable } from '@legendapp/state';
import { Synced } from '@legendapp/state/sync';

declare function useObservableSyncedQuery<TQueryFnData = unknown, TError = DefaultError, TData = TQueryFnData, TQueryKey extends QueryKey = QueryKey>(params: Omit<SyncedQueryParams<TQueryFnData, TError, TData, TQueryKey>, 'queryClient'> & {
    queryClient?: QueryClient;
}): Observable<Synced<TData>>;

export { useObservableSyncedQuery };
