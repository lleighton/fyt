import { Change } from '@legendapp/state';
import { ObservablePersistPlugin, ObservablePersistIndexedDBPluginOptions, ObservablePersistPluginOptions, PersistOptions, PersistMetadata } from '@legendapp/state/sync';

declare class ObservablePersistIndexedDB implements ObservablePersistPlugin {
    private tableData;
    private tableMetadata;
    private tablesAdjusted;
    private db;
    private isSaveTaskQueued;
    private pendingSaves;
    private promisesQueued;
    private configuration;
    constructor(configuration: ObservablePersistIndexedDBPluginOptions);
    initialize(configOptions: ObservablePersistPluginOptions): Promise<void>;
    loadTable(table: string, config: PersistOptions): void | Promise<void>;
    getTable(table: string, init: object, config: PersistOptions): any;
    getMetadata(table: string, config: PersistOptions): any;
    setMetadata(table: string, metadata: PersistMetadata, config: PersistOptions): Promise<IDBRequest<IDBValidKey>>;
    deleteMetadata(table: string, config: PersistOptions): Promise<void>;
    set(table: string, changes: Change[], config: PersistOptions): Promise<void>;
    private doSave;
    deleteTable(table: string, config: PersistOptions): Promise<void>;
    private getMetadataTableName;
    private initTable;
    private transactionStore;
    private _setItem;
    private _setTable;
}
declare function observablePersistIndexedDB(configuration: ObservablePersistIndexedDBPluginOptions): ObservablePersistIndexedDB;

export { ObservablePersistIndexedDB, observablePersistIndexedDB };
