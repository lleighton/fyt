import { ObservableParam, Linked } from '@legendapp/state';

declare function arrayAsRecord<T, TKey extends keyof T>(arr$: ObservableParam<T[]>, keyField?: TKey): Linked<Record<string, T>>;

export { arrayAsRecord };
