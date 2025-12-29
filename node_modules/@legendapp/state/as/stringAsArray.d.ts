import { ObservableParam, Linked } from '@legendapp/state';

declare function stringAsArray<T>(str$: ObservableParam<string>): Linked<T[]>;

export { stringAsArray };
