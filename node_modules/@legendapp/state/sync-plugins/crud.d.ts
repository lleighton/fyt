import { WaitForSetFnParams, ObservableParam, ObservableEvent } from '@legendapp/state';
import { SyncedGetParams, SyncedErrorParams, SyncedOptions, SyncedSetParams, SyncedSubscribeParams } from '@legendapp/state/sync';

type CrudAsOption = 'Map' | 'object' | 'value' | 'array';
type CrudResult<T> = T;
interface SyncedCrudPropsNoRead<TLocal, TAsOption extends CrudAsOption> {
    get?: never | undefined;
    list?: never | undefined;
    initial?: InitialValue<TLocal, TAsOption>;
    as?: TAsOption;
}
interface SyncedCrudPropsSingle<TRemote extends object, TLocal> {
    get: (params: SyncedGetParams<TRemote>) => Promise<CrudResult<TRemote | null>> | CrudResult<TRemote | null>;
    list?: never | undefined;
    initial?: InitialValue<Partial<NoInfer<TLocal>>, 'value'>;
    as?: never | 'value';
}
interface SyncedCrudPropsMany<TRemote extends object, TLocal, TAsOption extends CrudAsOption> {
    list: (params: SyncedGetParams<TRemote>) => Promise<CrudResult<TRemote[] | null>> | CrudResult<TRemote[] | null>;
    get?: never | undefined;
    as?: TAsOption;
    initial?: InitialValue<Partial<NoInfer<TLocal>>, TAsOption>;
}
interface SyncedCrudOnSavedParams<TRemote extends object, TLocal> {
    saved: TLocal;
    input: TRemote;
    currentValue: TLocal;
    isCreate: boolean;
    props: SyncedCrudPropsBase<TRemote, TLocal>;
}
interface WaitForSetCrudFnParams<T> extends WaitForSetFnParams<T> {
    type: 'create' | 'update' | 'delete';
}
interface CrudErrorParams extends Omit<SyncedErrorParams, 'source'> {
    source: 'list' | 'get' | 'create' | 'update' | 'delete' | 'unknown';
}
type CrudOnErrorFn = (error: Error, params: CrudErrorParams) => void;
interface SyncedCrudPropsBase<TRemote extends object, TLocal = TRemote> extends Omit<SyncedOptions<TRemote, TLocal>, 'get' | 'set' | 'initial' | 'subscribe' | 'waitForSet' | 'onError'> {
    create?(input: TRemote, params: SyncedSetParams<TRemote>): Promise<CrudResult<TRemote> | null | undefined | void>;
    update?(input: Partial<TRemote>, params: SyncedSetParams<TRemote>): Promise<CrudResult<Partial<TRemote> | null | undefined | void>>;
    delete?(input: TRemote, params: SyncedSetParams<TRemote>): Promise<any>;
    onSaved?(params: SyncedCrudOnSavedParams<TRemote, TLocal>): Partial<TLocal> | void;
    fieldId?: string;
    fieldUpdatedAt?: string;
    fieldCreatedAt?: string;
    fieldDeleted?: string;
    fieldDeletedList?: string;
    updatePartial?: boolean;
    changesSince?: 'all' | 'last-sync';
    generateId?: () => string | number;
    subscribe?: (params: SyncedSubscribeParams<TRemote[]>) => (() => void) | void;
    waitForSet?: ((params: WaitForSetCrudFnParams<TLocal>) => any) | Promise<any> | ObservableParam<any> | ObservableEvent;
    onError?: (error: Error, params: CrudErrorParams) => void;
}
type InitialValue<TLocal, TAsOption extends CrudAsOption> = TAsOption extends 'Map' ? Map<string | number, TLocal> : TAsOption extends 'object' ? Record<string | number, TLocal> : TAsOption extends 'value' ? TLocal : TLocal[];
type SyncedCrudReturnType<TLocal, TAsOption extends CrudAsOption> = TAsOption extends 'Map' ? Map<TLocal extends {
    id: number;
} ? number : string, TLocal> : TAsOption extends 'object' ? Record<TLocal extends {
    id: number;
} ? number : string, TLocal> : TAsOption extends 'value' ? TLocal : TLocal[];
declare function syncedCrud<TRemote extends object, TLocal = TRemote, TAsOption extends CrudAsOption = 'object'>(props: SyncedCrudPropsNoRead<TRemote, TAsOption> & SyncedCrudPropsBase<TRemote, TLocal>): SyncedCrudReturnType<TLocal, TAsOption>;
declare function syncedCrud<TRemote extends object, TLocal = TRemote>(props: SyncedCrudPropsSingle<TRemote, TLocal> & SyncedCrudPropsBase<TRemote, TLocal>): SyncedCrudReturnType<TLocal, 'value'>;
declare function syncedCrud<TRemote extends object, TLocal = TRemote, TAsOption extends CrudAsOption = 'object'>(props: SyncedCrudPropsMany<TRemote, TLocal, TAsOption> & SyncedCrudPropsBase<TRemote, TLocal>): SyncedCrudReturnType<TLocal, Exclude<TAsOption, 'value'>>;
declare function syncedCrud<TRemote extends object, TLocal = TRemote, TAsOption extends CrudAsOption = 'object'>(props: (SyncedCrudPropsSingle<TRemote, TLocal> | SyncedCrudPropsMany<TRemote, TLocal, TAsOption>) & SyncedCrudPropsBase<TRemote, TLocal>): SyncedCrudReturnType<TLocal, TAsOption>;

export { type CrudAsOption, type CrudErrorParams, type CrudOnErrorFn, type CrudResult, type SyncedCrudOnSavedParams, type SyncedCrudPropsBase, type SyncedCrudPropsMany, type SyncedCrudPropsNoRead, type SyncedCrudPropsSingle, type SyncedCrudReturnType, type WaitForSetCrudFnParams, syncedCrud };
