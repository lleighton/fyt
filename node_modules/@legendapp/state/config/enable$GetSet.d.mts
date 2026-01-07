declare function enable$GetSet(): void;
declare const enableDirectAccess: typeof enable$GetSet;
declare module '@legendapp/state' {
    interface ImmutableObservableBase<T> {
        get $(): T;
        set $(value: T | null | undefined);
    }
}

export { enable$GetSet, enableDirectAccess };
