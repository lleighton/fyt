import { Observable } from '@legendapp/state';
import { SyncedOptions, SyncedOptionsGlobal, SyncedGetParams } from '@legendapp/state/sync';
import { SyncedCrudPropsBase, CrudAsOption, SyncedCrudReturnType, SyncedCrudPropsMany } from '@legendapp/state/sync-plugins/crud';
import { FunctionsResponse } from '@supabase/functions-js';
import { PostgrestFilterBuilder, PostgrestQueryBuilder } from '@supabase/postgrest-js';
import { SupabaseClient, PostgrestSingleResponse } from '@supabase/supabase-js';

type DatabaseOf<Client extends SupabaseClient> = Client extends SupabaseClient<infer TDB> ? TDB : never;
type SchemaNameOf<Client extends SupabaseClient> = keyof DatabaseOf<Client>;
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;
type IsUnionOfStrings<T> = [T] extends [string] ? ([T] extends [UnionToIntersection<T>] ? false : true) : false;
type SupabaseSchemaOf<Client extends SupabaseClient> = Client extends SupabaseClient<infer _, infer __, infer Schema> ? Schema : never;
type SupabaseTableOf<Client extends SupabaseClient, SchemaName extends SchemaNameOf<Client>> = DatabaseOf<Client>[SchemaName]['Tables'];
type SupabaseViewOf<Client extends SupabaseClient, SchemaName extends SchemaNameOf<Client>> = DatabaseOf<Client>[SchemaName]['Views'];
type SupabaseCollectionOf<Client extends SupabaseClient, SchemaName extends SchemaNameOf<Client>> = keyof SupabaseTableOf<Client, IsUnionOfStrings<SchemaName> extends true ? 'public' : SchemaName> | keyof SupabaseViewOf<Client, IsUnionOfStrings<SchemaName> extends true ? 'public' : SchemaName>;
type SupabaseRowOf<Client extends SupabaseClient, Collection extends SupabaseCollectionOf<Client, SchemaName>, SchemaName extends SchemaNameOf<Client>> = SupabaseTableOf<Client, SchemaName>[Collection]['Row'];
type SyncedSupabaseConfig<TRemote extends {
    id: string | number;
}, TLocal> = Omit<SyncedCrudPropsBase<TRemote, TLocal>, 'create' | 'update' | 'delete'>;
interface SyncedSupabaseConfiguration extends Omit<SyncedSupabaseConfig<{
    id: string | number;
}, {
    id: string | number;
}>, 'persist' | keyof SyncedOptions> {
    persist?: SyncedOptionsGlobal;
    enabled?: Observable<boolean>;
    as?: Exclude<CrudAsOption, 'value'>;
}
interface SyncedSupabaseProps<Client extends SupabaseClient<any, any>, Collection extends SupabaseCollectionOf<Client, SchemaName>, SchemaName extends SchemaNameOf<Client> = 'public', TOption extends CrudAsOption = 'object', TRemote extends SupabaseRowOf<Client, Collection, SchemaName> = SupabaseRowOf<Client, Collection, SchemaName>, TLocal = TRemote> extends SyncedSupabaseConfig<TRemote, TLocal>, Omit<SyncedCrudPropsMany<TRemote, TRemote, TOption>, 'list'> {
    supabase?: Client;
    collection: Collection;
    schema?: SchemaName;
    select?: never;
    filter?: (select: PostgrestFilterBuilder<SupabaseSchemaOf<Client>, TRemote, TRemote[], Collection, []>, params: SyncedGetParams<TRemote>) => PostgrestFilterBuilder<SupabaseSchemaOf<Client>, TRemote, TRemote[], Collection, []>;
    actions?: ('create' | 'read' | 'update' | 'delete')[];
    realtime?: boolean | {
        schema?: string;
        filter?: string;
    };
    stringifyDates?: boolean;
    list?: (...params: Parameters<Required<SyncedCrudPropsMany<TRemote, TLocal, TOption>>['list']>) => PromiseLike<PostgrestSingleResponse<TRemote[]>> | Promise<FunctionsResponse<NoInfer<TRemote>[]>>;
    create?: (...params: Parameters<Required<SyncedCrudPropsBase<TRemote>>['create']>) => PromiseLike<PostgrestSingleResponse<TRemote>> | Promise<FunctionsResponse<NoInfer<TRemote>>>;
    update?: (...params: Parameters<Required<SyncedCrudPropsBase<TRemote>>['update']>) => PromiseLike<PostgrestSingleResponse<TRemote>> | Promise<FunctionsResponse<NoInfer<TRemote>>>;
    delete?: (...params: Parameters<Required<SyncedCrudPropsBase<TRemote>>['delete']>) => PromiseLike<PostgrestSingleResponse<TRemote>> | Promise<FunctionsResponse<NoInfer<TRemote>>>;
}
interface SyncedSupabasePropsWithSelect<Client extends SupabaseClient<any, any>, Collection extends SupabaseCollectionOf<Client, SchemaName>, SchemaName extends SchemaNameOf<Client> = 'public', TOption extends CrudAsOption = 'object', TRemote extends SupabaseRowOf<Client, Collection, SchemaName> = SupabaseRowOf<Client, Collection, SchemaName>, TLocal = TRemote> extends Omit<SyncedSupabaseProps<Client, Collection, SchemaName, TOption, TRemote, TLocal>, 'select'> {
    select: (query: PostgrestQueryBuilder<SupabaseSchemaOf<Client>, SupabaseTableOf<Client, SchemaName>[Collection], Collection>) => PostgrestFilterBuilder<SupabaseSchemaOf<Client>, TRemote, TRemote[], Collection, []>;
}
declare function getSyncedSupabaseConfiguration(): SyncedSupabaseConfiguration;
declare function configureSyncedSupabase(config: SyncedSupabaseConfiguration): void;
declare function syncedSupabase<Client extends SupabaseClient<any, any>, Collection extends SupabaseCollectionOf<Client, SchemaName> & string, SchemaName extends SchemaNameOf<Client> = 'public', AsOption extends CrudAsOption = 'object', TRemote = SupabaseRowOf<Client, Collection, SchemaName>, TLocal = TRemote>(props: SyncedSupabasePropsWithSelect<Client, Collection, SchemaName, AsOption, TRemote, TLocal>): SyncedCrudReturnType<TLocal, AsOption>;
declare function syncedSupabase<Client extends SupabaseClient<any, any>, Collection extends SupabaseCollectionOf<Client, SchemaName> & string, SchemaName extends SchemaNameOf<Client> = 'public', AsOption extends CrudAsOption = 'object', TRemote extends SupabaseRowOf<Client, Collection, SchemaName> = SupabaseRowOf<Client, Collection, SchemaName>, TLocal = TRemote>(props: SyncedSupabaseProps<Client, Collection, SchemaName, AsOption, TRemote, TLocal>): SyncedCrudReturnType<TLocal, AsOption>;

export { type SupabaseCollectionOf, type SupabaseRowOf, type SupabaseSchemaOf, type SupabaseTableOf, type SupabaseViewOf, type SyncedSupabaseConfig, type SyncedSupabaseConfiguration, configureSyncedSupabase, getSyncedSupabaseConfiguration, syncedSupabase };
