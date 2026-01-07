declare function enable_PeekAssign(): void;
declare const enableDirectAccess: typeof enable_PeekAssign;
declare module '@legendapp/state' {
    interface ImmutableObservableBase<T> {
        get _(): T;
        set _(value: T | null | undefined);
    }
}

export { enableDirectAccess, enable_PeekAssign };
