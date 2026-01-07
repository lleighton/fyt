import { Change } from '@legendapp/state';
import { ObservablePersistPlugin, PersistMetadata } from '@legendapp/state/sync';
import { SQLiteStorage } from 'expo-sqlite/kv-store';

declare class ObservablePersistSqlite implements ObservablePersistPlugin {
    private data;
    private storage;
    constructor(storage: SQLiteStorage);
    getTable(table: string, init: any): any;
    getMetadata(table: string): PersistMetadata;
    set(table: string, changes: Change[]): void;
    setMetadata(table: string, metadata: PersistMetadata): void;
    deleteTable(table: string): undefined;
    deleteMetadata(table: string): void;
    private save;
}
declare function observablePersistSqlite(storage: SQLiteStorage): ObservablePersistSqlite;

export { ObservablePersistSqlite, observablePersistSqlite };
