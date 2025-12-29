import { Selector } from '@legendapp/state';
import { SyncedOptions, Synced } from '@legendapp/state/sync';

interface SyncedFetchOnSavedParams<TRemote, TLocal = TRemote> {
    saved: TLocal;
    input: TRemote;
    currentValue: TLocal;
    props: SyncedFetchProps<TRemote, TLocal>;
}
interface SyncedFetchProps<TRemote, TLocal = TRemote> extends Omit<SyncedOptions<TRemote, TLocal>, 'get' | 'set'> {
    get: Selector<string>;
    set?: Selector<string>;
    getInit?: RequestInit;
    setInit?: RequestInit;
    valueType?: 'arrayBuffer' | 'blob' | 'formData' | 'json' | 'text';
    onSavedValueType?: 'arrayBuffer' | 'blob' | 'formData' | 'json' | 'text';
    onSaved?: (params: SyncedFetchOnSavedParams<TRemote, TLocal>) => Partial<TLocal> | void;
}
declare function syncedFetch<TRemote, TLocal = TRemote>(props: SyncedFetchProps<TRemote, TLocal>): Synced<TLocal>;

export { type SyncedFetchOnSavedParams, type SyncedFetchProps, syncedFetch };
