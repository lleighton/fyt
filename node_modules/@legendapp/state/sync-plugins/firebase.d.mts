import { FieldTransforms, SyncedErrorParams } from '@legendapp/state/sync';
export { FieldTransforms } from '@legendapp/state/sync';
import { CrudAsOption, SyncedCrudPropsMany, SyncedCrudPropsBase, SyncedCrudReturnType } from '@legendapp/state/sync-plugins/crud';
import { DatabaseReference, Query } from 'firebase/database';

declare function transformObjectFields(dataIn: Record<string, any>, map: Record<string, any>): any;
declare function invertFieldMap(obj: Record<string, any>): any;

interface SyncedFirebaseProps<TRemote extends object, TLocal, TAs extends CrudAsOption = 'value'> extends Omit<SyncedCrudPropsMany<TRemote, TLocal, TAs>, 'list' | 'retry'>, Omit<SyncedCrudPropsBase<TRemote, TLocal>, 'onError'> {
    refPath: (uid: string | undefined) => string;
    query?: (ref: DatabaseReference) => DatabaseReference | Query;
    fieldId?: string;
    fieldTransforms?: FieldTransforms<TRemote>;
    onError?: (error: Error, params: FirebaseErrorParams) => void;
    realtime?: boolean;
    requireAuth?: boolean;
    readonly?: boolean;
}
interface SyncedFirebaseConfiguration {
    realtime?: boolean;
    requireAuth?: boolean;
    readonly?: boolean;
    enabled?: boolean;
}
declare function configureSyncedFirebase(config: SyncedFirebaseConfiguration): void;
interface FirebaseErrorParams extends Omit<SyncedErrorParams, 'source'> {
    source: 'list' | 'get' | 'create' | 'update' | 'delete';
}
declare function syncedFirebase<TRemote extends object, TLocal = TRemote, TAs extends CrudAsOption = 'object'>(props: SyncedFirebaseProps<TRemote, TLocal, TAs>): SyncedCrudReturnType<TLocal, TAs>;

export { type FirebaseErrorParams, type SyncedFirebaseProps, configureSyncedFirebase, invertFieldMap, syncedFirebase, transformObjectFields };
