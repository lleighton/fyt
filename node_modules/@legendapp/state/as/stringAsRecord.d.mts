import { ObservableParam, Linked } from '@legendapp/state';

declare function stringAsRecord<T extends Record<string, any>>(str$: ObservableParam<string>): Linked<T>;

export { stringAsRecord };
