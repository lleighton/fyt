type Primitive$1 = string | number | boolean | symbol | bigint | undefined | null | Date | OpaqueObject<unknown>;
type ArrayOverrideFnNames = 'find' | 'findIndex' | 'every' | 'some' | 'filter' | 'reduce' | 'reduceRight' | 'forEach' | 'map' | 'sort';
type RemoveIndex<T> = {
    [K in keyof T as string extends K ? never : number extends K ? never : K]: T[K];
};
type BuiltIns = String | Boolean | Number | Date | Error | RegExp | Array<any> | Function | Promise<any>;
type IsUserDefinedObject<T> = T extends Function | BuiltIns | any[] ? false : T extends object ? true : false;
type RemoveObservables<T> = T extends ImmutableObservableBase<infer t> ? t : T extends ImmutableObservableBase<infer t>[] ? t[] : IsUserDefinedObject<T> extends true ? {
    [K in keyof T]: RemoveObservables<T[K]>;
} : T extends ImmutableObservableBase<infer TObs> ? TObs : T extends () => infer TRet ? RemoveObservables<TRet> & T : T extends (key: infer TKey extends string | number) => infer TRet ? Record<TKey, RemoveObservables<TRet>> & T : T extends OpaqueObject<infer TObj> ? TObj : T;
interface ObservableArray<T, U> extends ObservablePrimitive<T>, Pick<Array<Observable<U>>, ArrayOverrideFnNames>, Omit<RemoveIndex<Array<U>>, ArrayOverrideFnNames> {
}
interface ObservableObjectFns<T> {
    assign(value: Partial<T>): Observable<T>;
}
interface ObservableObjectFunctions<T = Record<string, any>> extends ObservablePrimitive<T>, ObservableObjectFns<T> {
}
type MapKey<T extends Map<any, any> | WeakMap<any, any>> = Parameters<T['has']>[0];
type MapValue<T extends Map<any, any> | WeakMap<any, any>> = ReturnType<T['get']>;
type ObservableMap<T extends Map<any, any> | WeakMap<any, any>> = Omit<T, 'get' | 'size' | 'set'> & Omit<ObservablePrimitive<T>, 'get' | 'size'> & Record<MapKey<T>, Observable<MapValue<T>>> & {
    get(key: Parameters<T['get']>[0]): Observable<Parameters<T['set']>[1]>;
    get(): T;
    size: number;
    set(key: MapKey<T>, value: MapValue<T>): Observable<T>;
    assign(value: Record<MapKey<T>, MapValue<T>> | Map<MapKey<T>, MapValue<T>> | WeakMap<MapKey<T>, MapValue<T>>): Observable<T>;
};
type SetValue<T extends Set<any> | WeakSet<any>> = Parameters<T['has']>[0];
type ObservableSet<T extends Set<any> | WeakSet<any>> = Omit<T, 'size' | 'add'> & Omit<ObservablePrimitive<T>, 'size'> & {
    size: number;
    add: (value: SetValue<T>) => Observable<T>;
};
interface ObservableBoolean extends ObservablePrimitive<boolean> {
    toggle(): void;
}
interface ObservablePrimitive<T> extends ImmutableObservableBase<T>, MutableObservableBase<T> {
}
type ObservableAny = Partial<ObservableObjectFns<any>> & ObservablePrimitive<any> & Record<string, any>;
interface ImmutableObservableSimple<T> {
    peek(): T;
    get(trackingType?: any): any;
    onChange(cb: ListenerFn<T>, options?: any): () => void;
}
interface ImmutableObservableBase<T> extends ImmutableObservableSimple<T> {
    peek(): RemoveObservables<T>;
    peek(): T;
    get(trackingType?: TrackingType | GetOptions): RemoveObservables<T>;
    onChange(cb: ListenerFn<T>, options?: {
        trackingType?: TrackingType;
        initial?: boolean;
        immediate?: boolean;
        noArgs?: boolean;
    }): () => void;
}
interface MutableObservableSimple {
    set(value: any): void;
    delete(): void;
}
interface MutableObservableBase<T> extends MutableObservableSimple {
    set(value: (prev: RemoveObservables<T>) => RemoveObservables<T>): void;
    set(value: Observable<RemoveObservables<T>>): void;
    set(value: RecursiveValueOrFunction<T>): void;
    set(value: Promise<RemoveObservables<T>>): void;
    set(value: RemoveObservables<T>): void;
    delete(): void;
}
type UndefinedIf<T, U> = U extends true ? T | undefined : T;
type IsNullable<T> = undefined extends T ? true : null extends T ? true : false;
type NonObservable = Function | Observable;
type NonObservableKeys<T> = {
    [K in keyof T]-?: IsStrictAny<T[K]> extends true ? never : T[K] extends undefined | null ? never : NonNullable<T[K]> extends NonObservable ? K : never;
}[keyof T];
type ObservableProps<T> = NonObservableKeys<NonNullable<T>> extends never ? T : RestoreNullability<T, Omit<NonNullable<T>, NonObservableKeys<NonNullable<T>>>>;
type NonObservableProps<T> = RestoreNullability<T, NullablePropsIf<Pick<NonNullable<T>, NonObservableKeys<NonNullable<T>>>, IsNullable<T>>>;
type NullablePropsIf<T, U> = {
    [K in keyof T]: UndefinedIf<T[K], U>;
};
type RestoreNullability<Source, Target> = IsNullable<Source> extends true ? Target | Extract<Source, null | undefined> : Target;
type ObservableChildren<T, Nullable = IsNullable<T>> = {
    [K in keyof T]-?: Observable<UndefinedIf<T[K], Nullable>>;
};
type ObservableFunctionChildren<T> = {
    [K in keyof T]-?: T[K] extends Observable ? T[K] : T[K] extends (key: infer Key extends string | number) => Promise<infer t> | infer t ? IsLookupFunction<T[K]> extends true ? Observable<Record<Key, t>> & T[K] : t extends void ? T[K] : t extends Observable ? t : Observable<t> & (() => t) : T[K] & Observable<T[K]>;
};
type IsStrictAny<T> = 0 extends 1 & T ? true : false;
type ObservableObject<T> = ObservableObjectFunctions<ObservableProps<T> & NonObservableProps<T>> & ObservableChildren<ObservableProps<T>> & ObservableFunctionChildren<NonObservableProps<T>>;
type ObservableFunction<T> = T extends () => infer t ? t | (() => t) : T;
type IsLookupFunction<T> = T extends (...args: infer P) => any ? P extends {
    length: 1;
} ? P[0] extends string | ObservablePrimitive<string> | number | ObservablePrimitive<number> ? true : false : false : false;
type ObservableNode<T, NT = NonNullable<T>> = [NT] extends [never] ? ObservablePrimitive<T> : IsStrictAny<T> extends true ? ObservableAny : [T] extends [Promise<infer t>] ? ObservableNode<t> : [T] extends [(key: infer K extends string) => infer t] ? [t] extends [ImmutableObservableBase<any>] ? IsLookupFunction<T> extends true ? Observable<Record<K, t>> : t : IsLookupFunction<T> extends true ? Observable<Record<K, t>> & T : Observable<ObservableFunction<t>> : [NT] extends [ImmutableObservableBase<any>] ? NT : [NT] extends [Primitive$1] ? [NT] extends [boolean] ? ObservableBoolean : ObservablePrimitive<T> : NT extends Map<any, any> | WeakMap<any, any> ? ObservableMap<NT> : NT extends Set<infer U> ? ObservableSet<Set<UndefinedIf<U, IsNullable<T>>>> : NT extends WeakSet<any> ? ObservableSet<NT> : NT extends Array<infer U> ? ObservableArray<T, U> & ObservableChildren<T> : ObservableObject<T> & {};
type Observable<T = any> = ObservableNode<T> & {};
type ObservableParam<T = any> = ImmutableObservableSimple<T> & MutableObservableSimple;
type FixExpanded<T> = [T] extends [boolean] ? boolean : T;
type ValueOrFunction<T> = [T] extends [Function] ? T : T | ImmutableObservableBase<FixExpanded<T> | T> | Promise<FixExpanded<T> | T> | (() => FixExpanded<T> | T | Promise<FixExpanded<T> | T> | ImmutableObservableBase<FixExpanded<T> | T>);
type ValueOrFunctionKeys<T> = {
    [K in keyof T]: RecursiveValueOrFunction<T[K]>;
};
type RecursiveValueOrFunction<T> = T extends Function ? T : T extends object ? ((key: string) => any) | Promise<ValueOrFunctionKeys<T>> | ValueOrFunctionKeys<T> | ImmutableObservableBase<T> | (() => T | Promise<T> | ValueOrFunctionKeys<T> | Promise<ValueOrFunctionKeys<T>> | Observable<T>) : ValueOrFunction<T>;

declare const symbolOpaque: unique symbol;
declare const symbolPlain: unique symbol;
declare function getPathType(value: any): TypeAtPath;
declare function safeStringify(value: any): any;
declare function safeParse(value: any): any;
declare function clone<T>(value: T): any;
declare function isObservable(value$: any): value$ is Observable;
declare function getNode(value$: ObservableParam): NodeInfo;
declare function setNodeValue(node: NodeInfo, newValue: any): {
    prevValue: any;
    newValue: any;
    parentValue: any;
};
declare function getNodeValue(node: NodeInfo): any;
declare function getChildNode(node: NodeInfo, key: string, asFunction?: Function): NodeInfo;
declare function ensureNodeValue(node: NodeInfo): any;
declare function findIDKey(obj: unknown | undefined, node: NodeInfo): string | ((value: any) => string) | undefined;
declare function getKeys(obj: Record<any, any> | Array<any> | undefined, isArr: boolean, isMap: boolean, isSet: boolean): string[];

type TrackingType = undefined | true | symbol;
interface GetOptions {
    shallow?: boolean;
}
type OpaqueObject<T> = T & {
    [symbolOpaque]: true;
};
type PlainObject<T> = T & {
    [symbolPlain]: true;
};
interface ListenerParams<T = any> {
    value: T;
    getPrevious: () => T;
    changes: Change[];
    isFromSync: boolean;
    isFromPersist: boolean;
}
type ListenerFn<T = any> = (params: ListenerParams<T>) => void;
interface ObservableEvent {
    fire(): void;
    on(cb?: () => void): ObservableListenerDispose;
    get(): void;
}
type TypeAtPath = 'object' | 'array' | 'map' | 'set';
interface Change {
    path: string[];
    pathTypes: TypeAtPath[];
    valueAtPath: any;
    prevAtPath: any;
}
type RecordValue<T> = T extends Record<string, infer t> ? t : never;
type ArrayValue<T> = T extends Array<infer t> ? t : never;
type ObservableValue<T> = T extends Observable<infer t> ? t : never;
type Selector<T> = ObservableParam<T> | ObservableEvent | (() => ObservableParam<T>) | (() => T) | T;
type ClassConstructor<I, Args extends any[] = any[]> = new (...args: Args) => I;
type ObservableListenerDispose = () => void;
interface ObservableRoot {
    _: any;
    set?: (value: any) => void;
    isLoadingLocal?: boolean;
}
type Primitive = boolean | string | number | Date;
type NotPrimitive<T> = T extends Primitive ? never : T;
interface NodeListener {
    track: TrackingType;
    noArgs?: boolean;
    listener: ListenerFn;
}
interface TrackingState {
    nodes?: Map<NodeInfo, TrackingNode>;
    traceListeners?: (nodes: Map<NodeInfo, TrackingNode>) => void;
    traceUpdates?: (fn: Function) => Function;
}
interface BaseNodeInfo {
    children?: Map<string, ChildNodeInfo>;
    proxy?: object;
    root: ObservableRoot;
    listeners?: Set<NodeListener>;
    listenersImmediate?: Set<NodeListener>;
    isEvent?: boolean;
    linkedToNode?: NodeInfo;
    linkedToNodeDispose?: () => void;
    activatedObserveDispose?: () => void;
    linkedFromNodes?: Set<NodeInfo>;
    isSetting?: number;
    isAssigning?: number;
    isComputing?: boolean;
    parentOther?: NodeInfo;
    functions?: Map<string, Function | Observable<any>>;
    lazy?: boolean;
    lazyFn?: Function;
    needsExtract?: boolean;
    numListenersRecursive: number;
    state?: Observable<ObservableSyncState>;
    activated?: boolean;
    isPlain?: boolean;
    recursivelyAutoActivated?: boolean;
    activationState?: LinkedOptions & {
        onError?: () => void;
        onChange: (params: UpdateFnParams) => void | Promise<void>;
    };
    dirtyFn?: () => void;
    dirtyChildren?: Set<NodeInfo>;
    numGets?: number;
    getNumResolved?: number;
}
interface RootNodeInfo extends BaseNodeInfo {
    parent?: undefined;
    key?: undefined;
}
interface ChildNodeInfo extends BaseNodeInfo {
    parent: NodeInfo;
    key: string;
}
type NodeInfo = RootNodeInfo | ChildNodeInfo;
interface TrackingNode {
    node: NodeInfo;
    track: TrackingType;
    num: number;
}
interface ObserveEvent<T> {
    num: number;
    previous?: T | undefined;
    cancel?: boolean;
    onCleanup?: () => void;
}
interface ObserveEventCallback<T> {
    num: number;
    previous?: T | undefined;
    value?: T;
    cancel: boolean;
    nodes: Map<NodeInfo, TrackingNode> | undefined;
    refresh: () => void;
    onCleanup?: () => void;
    onCleanupReaction?: () => void;
}
type SetParams<T> = ListenerParams<T extends Promise<infer t> ? t : T>;
type WaitForSet<T> = ((params: WaitForSetFnParams<T>) => any) | Promise<any> | ObservableParam<any> | ObservableEvent | ObservableParam<any>[] | ObservableEvent[];
interface LinkedOptions<T = any> {
    get?: () => Promise<T> | T;
    set?: (params: SetParams<T>) => void | Promise<any>;
    waitFor?: Selector<unknown>;
    waitForSet?: WaitForSet<T>;
    initial?: (() => T) | T;
    activate?: 'auto' | 'lazy';
}
interface WaitForSetFnParams<T = any> {
    value: T;
    changes: Change[];
}
type GetMode = 'set' | 'assign' | 'merge' | 'append' | 'prepend';
interface UpdateFnParams<T = any> {
    value: T;
    mode?: GetMode;
    lastSync?: number | undefined;
    changes?: Change[];
}
interface UpdateSetFnParams<T = any> extends UpdateFnParams<T> {
    lastSync?: never;
}
type UpdateFn<T = any> = (params: UpdateFnParams<T>) => void;
type UpdateSetFn<T = any> = (params: UpdateSetFnParams<T>) => void;
type Linked<T> = T;
interface ObserveOptions {
    immediate?: boolean;
}
interface ObservableSyncStateOptions {
    resetLastSync?: boolean;
}
interface ObservableSyncStateBase {
    isPersistLoaded: boolean;
    isPersistEnabled: boolean;
    isSyncEnabled: boolean;
    lastSync?: number;
    syncCount?: number;
    isGetting?: boolean;
    isSetting?: boolean;
    numPendingGets?: number;
    numPendingSets?: number;
    sync: (options?: ObservableSyncStateOptions) => Promise<void>;
    getPendingChanges: () => Record<string, {
        p: any;
        v?: any;
    }> | undefined;
    resetPersistence: () => Promise<void>;
    reset: () => Promise<void>;
    numPendingRemoteLoads?: number;
    clearPersist: () => Promise<void>;
}
interface ObservableState {
    isLoaded: boolean;
    error?: Error;
}
type ObservableSyncState = ObservableState & ObservableSyncStateBase;
interface RetryOptions {
    infinite?: boolean;
    times?: number;
    delay?: number;
    backoff?: 'constant' | 'exponential';
    maxDelay?: number;
}

declare const ObservableHint: {
    opaque: <T extends object>(value: T) => OpaqueObject<T>;
    plain: <T extends object>(value: T) => PlainObject<T>;
    function: <T extends object>(value: T) => PlainObject<T>;
};

declare function getProxy(node: NodeInfo, p?: string, asFunction?: Function): Observable;
declare function set(node: NodeInfo, newValue?: any): void;
declare function get(node: NodeInfo, options?: TrackingType | GetOptions): any;
declare function peek(node: NodeInfo): any;
declare function deactivateNode(node: NodeInfo): void;
declare function reactivateNode(node: NodeInfo, lazyFn: Function): void;
declare function isObserved(node: NodeInfo): boolean;
declare function shouldIgnoreUnobserved(node: NodeInfo, refreshFn: () => void): true | undefined;

declare function createPreviousHandler(value: any, changes: Change[]): () => any;
declare function batch(fn: () => void): void;
declare function beginBatch(): void;
declare function endBatch(force?: boolean): void;

declare function computed<T>(get: () => RecursiveValueOrFunction<T>): Observable<T>;
declare function computed<T, T2 = T>(get: (() => RecursiveValueOrFunction<T>) | RecursiveValueOrFunction<T>, set: (value: T2) => void): Observable<T>;

declare function event(): ObservableEvent;

declare function computeSelector<T>(selector: Selector<T>, getOptions?: GetOptions, e?: ObserveEvent<T>, retainObservable?: boolean): T;
declare function getObservableIndex(value$: ObservableParam): number;
declare function opaqueObject<T extends object>(value: T): OpaqueObject<T>;
declare function getValueAtPath(obj: Record<string, any>, path: string[]): any;
declare function setAtPath<T extends object>(obj: T, path: string[], pathTypes: TypeAtPath[], value: any, mode?: 'set' | 'merge', fullObj?: T, restore?: (path: string[], value: any) => void): T;
declare function mergeIntoObservable<T extends ObservableParam<any>>(target: T, ...sources: any[]): T;
declare function constructObjectWithPath(path: string[], pathTypes: TypeAtPath[], value: any): object;
declare function deconstructObjectWithPath(path: string[], pathTypes: TypeAtPath[], value: any): object;
declare function isObservableValueReady(value: any): boolean;
declare function setSilently(value$: ObservableParam, newValue: any): any;
declare function initializePathType(pathType: TypeAtPath): any;
declare function applyChange<T extends object>(value: T, change: Change, applyPrevious?: boolean): T;
declare function applyChanges<T extends object>(value: T, changes: Change[], applyPrevious?: boolean): T;
declare function deepMerge<T>(target: T, ...sources: any[]): T;

declare const hasOwnProperty: (v: PropertyKey) => boolean;
declare function isArray(obj: unknown): obj is Array<any>;
declare function isString(obj: unknown): obj is string;
declare function isObject(obj: unknown): obj is Record<any, any>;
declare function isPlainObject(obj: unknown): obj is Record<any, any>;
declare function isFunction(obj: unknown): obj is Function;
declare function isPrimitive(arg: unknown): arg is string | number | bigint | boolean | symbol;
declare function isDate(obj: unknown): obj is Date;
declare function isSymbol(obj: unknown): obj is symbol;
declare function isBoolean(obj: unknown): obj is boolean;
declare function isPromise<T>(obj: unknown): obj is Promise<T>;
declare function isMap(obj: unknown): obj is Map<any, any>;
declare function isSet(obj: unknown): obj is Set<any>;
declare function isNumber(obj: unknown): obj is number;
declare function isEmpty(obj: object): boolean;
declare function isNullOrUndefined(value: any): value is undefined | null;

declare function linked<T>(params: LinkedOptions<T> | (() => T), options?: LinkedOptions<T>): Linked<T>;

declare function observable<T>(): Observable<T | undefined>;
declare function observable<T>(value: Promise<RecursiveValueOrFunction<T>> | (() => RecursiveValueOrFunction<T>) | RecursiveValueOrFunction<T>): Observable<T>;
declare function observable<T>(value: T): Observable<T>;
declare function observablePrimitive<T>(value: Promise<T>): ObservablePrimitive<T>;
declare function observablePrimitive<T>(value?: T): ObservablePrimitive<T>;

declare function observe<T>(run: (e: ObserveEvent<T>) => T | void, options?: ObserveOptions): () => void;
declare function observe<T>(selector: Selector<T> | ((e: ObserveEvent<T>) => any), reaction?: (e: ObserveEventCallback<T>) => any, options?: ObserveOptions): () => void;

declare function proxy<T, T2 = T>(get: (key: string) => T, set: (key: string, value: T2) => void): Observable<Record<string, T>>;
declare function proxy<T extends Record<string, any>>(get: <K extends keyof T>(key: K) => ObservableParam<T[K]>): Observable<T>;
declare function proxy<T>(get: (key: string) => ObservableParam<T>): Observable<Record<string, T>>;
declare function proxy<T>(get: (key: string) => T): Observable<Record<string, T>>;

declare function syncState(obs: ObservableParam): Observable<ObservableSyncState>;

declare function trackSelector<T>(selector: Selector<T>, update: (params: ListenerParams) => void, getOptions?: GetOptions, observeEvent?: ObserveEvent<T>, observeOptions?: ObserveOptions, createResubscribe?: boolean): {
    nodes: Map<NodeInfo, TrackingNode> | undefined;
    value: T;
    dispose: (() => void) | undefined;
    resubscribe: (() => () => void) | undefined;
};

declare function when<T, T2>(predicate: Promise<T>, effect: (value: T) => T2): Promise<T2>;
declare function when<T, T2>(predicate: Selector<T>[], effect: (value: T[]) => T2): Promise<T2>;
declare function when<T, T2>(predicate: Selector<T>, effect: (value: T) => T2): Promise<T2>;
declare function when<T>(predicate: Selector<T>[]): Promise<T[]>;
declare function when<T>(predicate: Selector<T>): Promise<T>;
declare function whenReady<T, T2>(predicate: Promise<T>, effect: (value: T) => T2): Promise<T2>;
declare function whenReady<T, T2>(predicate: Selector<T>[], effect: (value: T[]) => T2): Promise<T2[]>;
declare function whenReady<T, T2>(predicate: Selector<T>, effect: (value: T) => T2): Promise<T2>;
declare function whenReady<T>(predicate: Selector<T>[]): Promise<T[]>;
declare function whenReady<T>(predicate: Selector<T>): Promise<T>;

interface ObservablePrimitiveState {
    _node: NodeInfo;
    toggle: () => void;
}
declare function ObservablePrimitiveClass<T>(this: ObservablePrimitive<T> & ObservablePrimitiveState, node: NodeInfo): void;

type MiddlewareEventType = 'listener-added' | 'listener-removed' | 'listeners-cleared';
interface MiddlewareEvent {
    type: MiddlewareEventType;
    node: NodeInfo;
    listener?: NodeListener;
    timestamp: number;
}
type MiddlewareHandler = (event: MiddlewareEvent) => void;
/**
 * Register a middleware handler for a specific node and event type
 * @param node The node to register the middleware handler for
 * @param type The event type to handle
 * @param handler The middleware handler function
 * @returns A function to remove the handler
 */
declare function registerMiddleware(node: NodeInfo, type: MiddlewareEventType, handler: MiddlewareHandler): () => void;

declare const internal: {
    createPreviousHandler: typeof createPreviousHandler;
    clone: typeof clone;
    deactivateNode: typeof deactivateNode;
    deepMerge: typeof deepMerge;
    ensureNodeValue: typeof ensureNodeValue;
    findIDKey: typeof findIDKey;
    get: typeof get;
    getChildNode: typeof getChildNode;
    getKeys: typeof getKeys;
    getNode: typeof getNode;
    getNodeValue: typeof getNodeValue;
    getPathType: typeof getPathType;
    getProxy: typeof getProxy;
    getValueAtPath: typeof getValueAtPath;
    globalState: {
        isLoadingLocal: boolean;
        isLoadingRemote: boolean;
        activateSyncedNode: (node: NodeInfo, newValue: any) => {
            update: UpdateFn;
            value: any;
        };
        pendingNodes: Map<NodeInfo, () => void>;
        dirtyNodes: Set<NodeInfo>;
        replacer: ((this: any, key: string, value: any) => any) | undefined;
        reviver: ((this: any, key: string, value: any) => any) | undefined;
    };
    initializePathType: typeof initializePathType;
    ObservablePrimitiveClass: typeof ObservablePrimitiveClass;
    observableProperties: Map<string, {
        get: (node: NodeInfo, ...args: any[]) => any;
        set: (node: NodeInfo, value: any) => any;
    }>;
    observableFns: Map<string, (node: NodeInfo, ...args: any[]) => any>;
    optimized: symbol;
    peek: typeof peek;
    reactivateNode: typeof reactivateNode;
    registerMiddleware: typeof registerMiddleware;
    safeParse: typeof safeParse;
    safeStringify: typeof safeStringify;
    set: typeof set;
    setAtPath: typeof setAtPath;
    setNodeValue: typeof setNodeValue;
    symbolLinked: symbol;
    symbolDelete: symbol;
    tracking: {
        current: TrackingState | undefined;
    };
};

export { type ArrayValue, type Change, type ChildNodeInfo, type ClassConstructor, type GetMode, type GetOptions, type ImmutableObservableBase, type Linked, type LinkedOptions, type ListenerFn, type ListenerParams, type NodeInfo, type NodeListener, type NotPrimitive, type Observable, type ObservableBoolean, type ObservableEvent, ObservableHint, type ObservableListenerDispose, type ObservableMap, type ObservableObject, type ObservableObjectFns, type ObservableParam, type ObservablePrimitive, type ObservableRoot, type ObservableState, type ObservableSyncState, type ObservableSyncStateBase, type ObservableSyncStateOptions, type ObservableValue, type ObserveEvent, type ObserveEventCallback, type ObserveOptions, type OpaqueObject, type PlainObject, type Primitive, type RecordValue, type RecursiveValueOrFunction, type RemoveObservables, type RetryOptions, type RootNodeInfo, type Selector, type SetParams, type TrackingNode, type TrackingState, type TrackingType, type TypeAtPath, type UpdateFn, type UpdateFnParams, type UpdateSetFn, type UpdateSetFnParams, type WaitForSet, type WaitForSetFnParams, applyChange, applyChanges, batch, beginBatch, computeSelector, computed, constructObjectWithPath, deconstructObjectWithPath, endBatch, event, getObservableIndex, hasOwnProperty, internal, isArray, isBoolean, isDate, isEmpty, isFunction, isMap, isNullOrUndefined, isNumber, isObject, isObservable, isObservableValueReady, isObserved, isPlainObject, isPrimitive, isPromise, isSet, isString, isSymbol, linked, mergeIntoObservable, observable, observablePrimitive, observe, opaqueObject, proxy, setAtPath, setSilently, shouldIgnoreUnobserved, syncState, trackSelector, when, whenReady };
