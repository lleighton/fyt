import { UseSelectorOptions } from '@legendapp/state/react';

declare function enableReactUse(): void;
declare module '@legendapp/state' {
    interface ImmutableObservableBase<T> {
        use(options?: UseSelectorOptions): T;
    }
}

export { enableReactUse };
