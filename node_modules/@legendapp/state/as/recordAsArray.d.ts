import { ObservableParam, Linked } from '@legendapp/state';

declare function recordAsArray<T, TKey extends keyof T>(record$: ObservableParam<Record<string | number, T>>, keyField?: TKey): Linked<T[]>;

export { recordAsArray };
