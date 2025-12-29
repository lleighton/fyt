import { MMKVConfiguration } from 'react-native-mmkv';
import { AsyncStorageStatic } from '@react-native-async-storage/async-storage';
import { ClassConstructor, NodeInfo, ObservableParam, GetMode, SetParams, UpdateSetFn, UpdateFn, LinkedOptions, RetryOptions, Change, Observable, ObservableSyncState, TypeAtPath, RecordValue, ArrayValue, WaitForSet } from '@legendapp/state';
import { SyncedOptionsGlobal as SyncedOptionsGlobal$1 } from '@legendapp/state/sync';

interface PersistOptions<T = any> {
    name?: string;
    plugin?: ClassConstructor<ObservablePersistPlugin, T[]> | ObservablePersistPlugin;
    retrySync?: boolean;
    transform?: SyncTransform<T>;
    readonly?: boolean;
    mmkv?: MMKVConfiguration;
    indexedDB?: {
        prefixID?: string;
        itemID?: string;
    };
    options?: any;
}
interface SyncedGetSetSubscribeBaseParams<T = any> {
    node: NodeInfo;
    value$: ObservableParam<T>;
    refresh: () => void;
}
interface SyncedGetSetBaseParams<T = any> extends SyncedGetSetSubscribeBaseParams<T>, OnErrorRetryParams {
}
interface OnErrorRetryParams {
    retryNum: number;
    cancelRetry: boolean;
}
interface SyncedGetParams<T> extends SyncedGetSetBaseParams<T> {
    value: any;
    lastSync: number | undefined;
    updateLastSync: (lastSync: number) => void;
    mode: GetMode;
    onError: (error: Error, params: SyncedErrorParams) => void;
    options: SyncedOptions;
}
interface SyncedSetParams<T> extends Pick<SetParams<T>, 'changes' | 'value'>, SyncedGetSetBaseParams<T> {
    update: UpdateSetFn<T>;
    onError: (error: Error, params: SyncedErrorParams) => void;
}
interface SyncedSubscribeParams<T = any> extends SyncedGetSetSubscribeBaseParams<T> {
    lastSync: number | undefined;
    update: UpdateFn<T>;
    onError: (error: Error) => void;
}
interface SyncedErrorParams {
    source: 'get' | 'set' | 'subscribe';
    type: 'get' | 'set';
    retry: OnErrorRetryParams;
    getParams?: SyncedGetParams<any>;
    setParams?: SyncedSetParams<any>;
    subscribeParams?: SyncedSubscribeParams<any>;
    input?: any;
    revert?: () => void;
}
interface SyncedOptions<TRemote = any, TLocal = TRemote> extends Omit<LinkedOptions<TRemote>, 'get' | 'set'> {
    get?: (params: SyncedGetParams<TRemote>) => Promise<TRemote> | TRemote;
    set?: (params: SyncedSetParams<TRemote>) => void | Promise<any>;
    subscribe?: (params: SyncedSubscribeParams<TRemote>) => (() => void) | void;
    retry?: RetryOptions;
    persist?: PersistOptions<any>;
    debounceSet?: number;
    syncMode?: 'auto' | 'manual';
    mode?: GetMode;
    transform?: SyncTransform<TLocal, TRemote>;
    onBeforeGet?: (params: {
        value: TRemote;
        lastSync: number | undefined;
        pendingChanges: PendingChanges | undefined;
        cancel: boolean;
        clearPendingChanges: () => Promise<void>;
        resetCache: () => Promise<void>;
    }) => void;
    onBeforeSet?: (params: {
        cancel: boolean;
    }) => void;
    onAfterSet?: () => void;
    onError?: (error: Error, params: SyncedErrorParams) => void;
}
interface SyncedOptionsGlobal<T = any> extends Omit<SyncedOptions<T>, 'get' | 'set' | 'persist' | 'initial' | 'waitForSet' | 'waitFor' | 'transform' | 'subscribe'> {
    persist?: ObservablePersistPluginOptions & Omit<PersistOptions, 'name' | 'transform' | 'options'>;
}
interface ObservablePersistIndexedDBPluginOptions {
    databaseName: string;
    version: number;
    tableNames: string[];
    deleteTableNames?: string[];
    onUpgradeNeeded?: (event: IDBVersionChangeEvent) => void;
}
interface ObservablePersistAsyncStoragePluginOptions {
    AsyncStorage: AsyncStorageStatic;
    preload?: boolean | string[];
}
interface ObservablePersistPluginOptions {
    onGetError?: (error: Error) => void;
    onSetError?: (error: Error) => void;
    indexedDB?: ObservablePersistIndexedDBPluginOptions;
    asyncStorage?: ObservablePersistAsyncStoragePluginOptions;
}
interface ObservablePersistPlugin {
    initialize?(config: ObservablePersistPluginOptions): void | Promise<void>;
    loadTable?(table: string, config: PersistOptions): Promise<any> | void;
    getTable<T = any>(table: string, init: object, config: PersistOptions): T;
    set(table: string, changes: Change[], config: PersistOptions): Promise<any> | void;
    deleteTable(table: string, config: PersistOptions): Promise<any> | void;
    getMetadata(table: string, config: PersistOptions): PersistMetadata;
    setMetadata(table: string, metadata: PersistMetadata, config: PersistOptions): Promise<any> | void;
    deleteMetadata(table: string, config: PersistOptions): Promise<any> | void;
}
interface PersistMetadata {
    id?: '__legend_metadata';
    lastSync?: number;
    pending?: any;
}
type SyncTransformMethod = 'get' | 'set';
interface SyncTransform<TLocal = any, TSaved = TLocal> {
    load?: (value: TSaved, method: SyncTransformMethod) => TLocal | Promise<TLocal>;
    save?: (value: TLocal) => TSaved | Promise<TSaved>;
}
interface ObservableSyncSetParams<T> {
    syncState: Observable<ObservableSyncState>;
    value$: ObservableParam<T>;
    options: SyncedOptions<T>;
    changes: Change[];
    value: T;
}
interface ObservableSyncFunctions<T = any> {
    get?(params: SyncedGetParams<T>): T | Promise<T>;
    set?(params: ObservableSyncSetParams<T>): void | Promise<void | {
        changes?: object | undefined;
        dateModified?: number;
        lastSync?: number;
    }>;
}
interface SubscribeOptions {
    node: NodeInfo;
    update: UpdateFn;
    refresh: () => void;
}
type Synced<T> = T;
type PendingChanges = Record<string, {
    p: any;
    v?: any;
    t: TypeAtPath[];
}>;

declare function configureObservableSync(options?: SyncedOptionsGlobal$1): void;

declare type ObjectKeys<T> = Pick<T, {
    [K in keyof T]-?: K extends string ? T[K] extends Record<string, any> ? T[K] extends any[] ? never : K : never : never;
}[keyof T]>;
declare type DictKeys<T> = Pick<T, {
    [K in keyof T]-?: K extends string ? (T[K] extends Record<string, Record<string, any>> ? K : never) : never;
}[keyof T]>;
declare type ArrayKeys<T> = Pick<T, {
    [K in keyof T]-?: K extends string | number ? (T[K] extends any[] ? K : never) : never;
}[keyof T]>;
declare type FieldTransforms<T> = (T extends Record<string, Record<string, any>> ? {
    _dict: FieldTransformsInner<RecordValue<T>>;
} : never) | FieldTransformsInner<T>;
declare type FieldTransformsInner<T> = {
    [K in keyof T]: string;
} & ({
    [K in keyof ObjectKeys<T> as `${K}_obj`]?: FieldTransforms<T[K]>;
} | {
    [K in keyof DictKeys<T> as `${K}_dict`]?: FieldTransforms<RecordValue<T[K]>>;
}) & {
    [K in keyof ArrayKeys<T> as `${K}_arr`]?: FieldTransforms<ArrayValue<T[K]>>;
} & {
    [K in keyof ArrayKeys<T> as `${K}_val`]?: FieldTransforms<ArrayValue<T[K]>>;
};
type QueryByModified<T> = boolean | {
    [K in keyof T]?: QueryByModified<T[K]>;
} | {
    '*'?: boolean;
};

declare function removeNullUndefined<T extends Record<string, any>>(a: T, recursive?: boolean): T;
declare function diffObjects<T extends Record<string, any>>(obj1: T, obj2: T, deep?: boolean): Partial<T>;
declare function deepEqual<T extends Record<string, any> = any>(a: T, b: T, ignoreFields?: string[], nullVsUndefined?: boolean): boolean;
declare function combineTransforms<T, T2>(...transforms: Partial<SyncTransform<T2, T>>[]): SyncTransform<T2, T>;
interface TransformStringifyOptions {
    stringifyIf?: {
        number?: boolean;
        object?: boolean;
        array?: boolean;
        date?: boolean;
    };
    filterArrays?: boolean;
}
type TransformStringifyKeys<TRemote, TLocal> = (keyof TRemote | {
    from: keyof TRemote;
    to: keyof TLocal;
})[];
type StringToDate<T extends Record<string, any>> = {
    [K in keyof T]: T[K] extends string ? string | Date : T[K];
};
declare function transformStringifyKeys<TRemote extends Record<string, any>, TLocal extends Record<string, any>>(...keys: TransformStringifyKeys<TRemote, TLocal>): SyncTransform<TLocal, TRemote>;
type TransformStringsToDates<T extends {}, Keys extends keyof T> = {
    [K in Keys]: Date | Exclude<T[K], string>;
} & Omit<T, Keys>;
declare function transformStringifyDates<TRemote extends Record<string, any>, TLocal extends Record<string, any> = TRemote>(): SyncTransform<TLocal, TRemote>;
declare function transformStringifyDates<TRemote extends Record<string, any>, Keys extends keyof TRemote = keyof TRemote>(...args: Keys[]): SyncTransform<TransformStringsToDates<TRemote, Keys>, TRemote>;
declare function transformStringifyDates<TRemote extends Record<string, any>, TLocal extends Record<string, any> = TRemote>(...args: (keyof TRemote)[]): SyncTransform<TRemote, TLocal>;

declare const mapSyncPlugins: WeakMap<ClassConstructor<ObservablePersistPlugin> | ObservablePersistPlugin, {
    plugin: ObservablePersistPlugin;
    initialized: Observable<boolean>;
}>;
declare function onChangeRemote(cb: () => void): void;
declare function syncObservable<T>(obs$: ObservableParam<T>, syncOptions: SyncedOptions<T>): Observable<ObservableSyncState>;
declare function syncObservable<T>(obs$: ObservableParam<T>, syncOptions: Synced<T>): Observable<ObservableSyncState>;
declare function getAllSyncStates(): readonly [Observable<ObservableSyncState>, NodeInfo][];

declare function synced<TRemote, TLocal = TRemote>(params: SyncedOptions<TRemote, TLocal> | (() => TRemote)): Synced<TLocal>;

declare function configureSynced<T extends (...args: any[]) => any>(fn: T, origOptions: Partial<Parameters<T>[0]>): T;
declare function configureSynced(origOptions: SyncedOptions): typeof synced;

declare function createRevertChanges(obs$: ObservableParam<any>, changes: Change[]): () => void;

declare function waitForSet(waitForSet: WaitForSet<any>, changes: Change[], value: any, params?: Record<string, any>): Promise<void>;

declare function runWithRetry<T>(state: SyncedGetSetBaseParams<any>, retryOptions: RetryOptions | undefined, retryId: any, fn: (params: OnErrorRetryParams) => Promise<T>): Promise<T>;
declare function runWithRetry<T>(state: SyncedGetSetBaseParams<any>, retryOptions: RetryOptions | undefined, retryId: any, fn: (params: OnErrorRetryParams) => T): T;

declare const internal: {
    observableSyncConfiguration: SyncedOptionsGlobal;
    waitForSet: typeof waitForSet;
    runWithRetry: typeof runWithRetry;
};

export { type FieldTransforms, type FieldTransformsInner, type ObservablePersistAsyncStoragePluginOptions, type ObservablePersistIndexedDBPluginOptions, type ObservablePersistPlugin, type ObservablePersistPluginOptions, type ObservableSyncFunctions, type ObservableSyncSetParams, type OnErrorRetryParams, type PendingChanges, type PersistMetadata, type PersistOptions, type QueryByModified, type StringToDate, type SubscribeOptions, type SyncTransform, type SyncTransformMethod, type Synced, type SyncedErrorParams, type SyncedGetParams, type SyncedGetSetBaseParams, type SyncedGetSetSubscribeBaseParams, type SyncedOptions, type SyncedOptionsGlobal, type SyncedSetParams, type SyncedSubscribeParams, type TransformStringifyKeys, type TransformStringifyOptions, type TransformStringsToDates, combineTransforms, configureObservableSync, configureSynced, createRevertChanges, deepEqual, diffObjects, getAllSyncStates, internal, mapSyncPlugins, onChangeRemote, removeNullUndefined, syncObservable, synced, transformStringifyDates, transformStringifyKeys };
