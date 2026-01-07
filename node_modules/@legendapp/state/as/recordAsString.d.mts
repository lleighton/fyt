import { ObservableParam, Linked } from '@legendapp/state';

declare function recordAsString(record$: ObservableParam<Record<any, any>>): Linked<string>;

export { recordAsString };
