import { SyncedOptions, Synced } from '@legendapp/state/sync';
import { QueryKey, QueryObserverOptions, QueryClient, MutationObserverOptions, DefaultError } from '@tanstack/query-core';

interface ObservableQueryOptions<TQueryFnData, TError, TData, TQueryKey extends QueryKey> extends Omit<QueryObserverOptions<TQueryFnData, TError, TData, TData, TQueryKey>, 'queryKey'> {
    queryKey?: TQueryKey | (() => TQueryKey);
}
interface SyncedQueryParams<TQueryFnData, TError, TData, TQueryKey extends QueryKey> extends Omit<SyncedOptions<TData>, 'get' | 'set' | 'retry'> {
    queryClient: QueryClient;
    query: ObservableQueryOptions<TQueryFnData, TError, TData, TQueryKey>;
    mutation?: MutationObserverOptions<TQueryFnData, TError, TData>;
}
declare function syncedQuery<TQueryFnData = unknown, TError = DefaultError, TData = TQueryFnData, TQueryKey extends QueryKey = QueryKey>(params: SyncedQueryParams<TQueryFnData, TError, TData, TQueryKey>): Synced<TData>;

export { type ObservableQueryOptions, type SyncedQueryParams, syncedQuery };
