import { SyncedGetSetSubscribeBaseParams } from '@legendapp/state/sync';
import { CrudErrorParams, SyncedCrudPropsBase, SyncedCrudReturnType, CrudAsOption, SyncedCrudPropsSingle, CrudResult, SyncedCrudPropsMany } from '@legendapp/state/sync-plugins/crud';

interface KeelObjectBase {
    id: string;
    createdAt: Date;
    updatedAt: Date;
}
type KeelKey = 'createdAt' | 'updatedAt';
declare const KeelKeys: KeelKey[];
type OmitKeelBuiltins<T, T2 extends string = ''> = Omit<T, KeelKey | T2>;
type APIError = {
    type: string;
    message: string;
    requestId?: string;
    error?: unknown;
};
type APIResult<T> = Result<T, APIError>;
type Data<T> = {
    data: T;
    error?: never;
};
type Err<U> = {
    data?: never;
    error: U;
};
type Result<T, U> = NonNullable<Data<T> | Err<U>>;
interface KeelGetParams {
}
interface KeelListParams<Where = {}> {
    where: {
        updatedAt?: {
            after: Date;
        };
    } & Where;
    after?: string;
    first?: number;
    last?: number;
    before?: string;
}
interface KeelRealtimePlugin {
    subscribe: (realtimeKey: string, params: SyncedGetSetSubscribeBaseParams) => () => void;
    setSaved: (realtimeKey: string) => void;
}
interface KeelClient {
    auth: {
        refresh: () => Promise<APIResult<boolean>>;
        isAuthenticated: () => Promise<APIResult<boolean>>;
    };
    api: {
        queries: Record<string, (i: any) => Promise<any>>;
    };
    client: {
        rawRequest: <T>(action: string, body: any) => Promise<APIResult<T>>;
    };
}
interface SyncedKeelPropsManyBase<TRemote extends {
    id: string;
}, TLocal, AOption extends CrudAsOption> extends Omit<SyncedCrudPropsMany<TRemote, TLocal, AOption>, 'list'> {
    first?: number;
    get?: never;
}
interface SyncedKeelPropsManyWhere<TRemote extends {
    id: string;
}, TLocal, AOption extends CrudAsOption, Where extends Record<string, any>> extends SyncedKeelPropsManyBase<TRemote, TLocal, AOption> {
    list?: (params: KeelListParams<NoInfer<Where>>) => Promise<CrudResult<APIResult<{
        results: TRemote[];
        pageInfo?: any;
    }>>>;
    where?: Where | (() => Where);
}
interface SyncedKeelPropsManyNoWhere<TRemote extends {
    id: string;
}, TLocal, AOption extends CrudAsOption> extends SyncedKeelPropsManyBase<TRemote, TLocal, AOption> {
    list?: (params: KeelListParams<{}>) => Promise<CrudResult<APIResult<{
        results: TRemote[];
        pageInfo?: any;
    }>>>;
    where?: never | {};
}
type HasAnyKeys<T> = keyof T extends never ? false : true;
type SyncedKeelPropsMany<TRemote extends {
    id: string;
}, TLocal, AOption extends CrudAsOption, Where extends Record<string, any>> = HasAnyKeys<Where> extends true ? SyncedKeelPropsManyWhere<TRemote, TLocal, AOption, Where> : SyncedKeelPropsManyNoWhere<TRemote, TLocal, AOption>;
interface SyncedKeelPropsSingle<TRemote extends {
    id: string;
}, TLocal> extends Omit<SyncedCrudPropsSingle<TRemote, TLocal>, 'get'> {
    get?: (params: KeelGetParams) => Promise<APIResult<TRemote>>;
    first?: never;
    where?: never;
    list?: never;
    as?: never;
}
interface KeelErrorParams extends CrudErrorParams {
    action: string;
}
interface SyncedKeelPropsBase<TRemote extends {
    id: string;
}, TLocal = TRemote> extends Omit<SyncedCrudPropsBase<TRemote, TLocal>, 'create' | 'update' | 'delete' | 'updatePartial' | 'fieldUpdatedAt' | 'fieldCreatedAt' | 'onError'> {
    client?: KeelClient;
    create?: (i: NoInfer<Partial<TRemote>>) => Promise<APIResult<NoInfer<TRemote>>>;
    update?: (params: {
        where: any;
        values?: Partial<NoInfer<TRemote>>;
    }) => Promise<APIResult<TRemote>>;
    delete?: (params: {
        id: string;
    }) => Promise<APIResult<string>>;
    realtime?: {
        path?: (action: string, inputs: any) => string | Promise<string>;
        plugin?: KeelRealtimePlugin;
    };
    refreshAuth?: () => void | Promise<void>;
    requireAuth?: boolean;
    onError?: (error: Error, params: KeelErrorParams) => void;
}
declare function syncedKeel<TRemote extends {
    id: string;
}, TLocal = TRemote>(props: SyncedKeelPropsBase<TRemote, TLocal> & SyncedKeelPropsSingle<TRemote, TLocal>): SyncedCrudReturnType<TLocal, 'value'>;
declare function syncedKeel<TRemote extends {
    id: string;
}, TLocal = TRemote, TOption extends CrudAsOption = 'object', Where extends Record<string, any> = {}>(props: SyncedKeelPropsBase<TRemote, TLocal> & SyncedKeelPropsMany<TRemote, TLocal, TOption, Where>): SyncedCrudReturnType<TLocal, Exclude<TOption, 'value'>>;

export { type KeelClient, type KeelErrorParams, type KeelGetParams, type KeelKey, KeelKeys, type KeelListParams, type KeelObjectBase, type KeelRealtimePlugin, type OmitKeelBuiltins, type SyncedKeelPropsBase, syncedKeel };
