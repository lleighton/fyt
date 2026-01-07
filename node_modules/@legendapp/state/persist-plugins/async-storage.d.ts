import { Change } from '@legendapp/state';
import { ObservablePersistPlugin, ObservablePersistAsyncStoragePluginOptions, ObservablePersistPluginOptions, PersistMetadata } from '@legendapp/state/sync';

declare class ObservablePersistAsyncStorage implements ObservablePersistPlugin {
    private data;
    private configuration;
    constructor(configuration: ObservablePersistAsyncStoragePluginOptions);
    initialize(configOptions: ObservablePersistPluginOptions): Promise<void>;
    loadTable(table: string): void | Promise<void>;
    getTable(table: string, init: object): any;
    getMetadata(table: string): PersistMetadata;
    set(table: string, changes: Change[]): Promise<void>;
    setMetadata(table: string, metadata: PersistMetadata): Promise<void>;
    deleteTable(table: string): Promise<void>;
    deleteMetadata(table: string): Promise<void>;
    private setValue;
    private save;
}
declare function observablePersistAsyncStorage(configuration: ObservablePersistAsyncStoragePluginOptions): ObservablePersistAsyncStorage;

export { ObservablePersistAsyncStorage, observablePersistAsyncStorage };
