import { Change } from '@legendapp/state';
import { ObservablePersistPlugin, PersistMetadata } from '@legendapp/state/sync';

declare class ObservablePersistLocalStorageBase implements ObservablePersistPlugin {
    private data;
    private storage;
    constructor(storage: Storage | undefined);
    getTable(table: string, init: any): any;
    getMetadata(table: string): PersistMetadata;
    set(table: string, changes: Change[]): void;
    setMetadata(table: string, metadata: PersistMetadata): void;
    deleteTable(table: string): undefined;
    deleteMetadata(table: string): void;
    private save;
}
declare class ObservablePersistLocalStorage extends ObservablePersistLocalStorageBase {
    constructor();
}
declare class ObservablePersistSessionStorage extends ObservablePersistLocalStorageBase {
    constructor();
}

export { ObservablePersistLocalStorage, ObservablePersistLocalStorageBase, ObservablePersistSessionStorage };
