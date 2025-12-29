import { ObservableParam, Linked } from '@legendapp/state';

declare function setAsArray<T>(set$: ObservableParam<Set<T>>): Linked<T[]>;

export { setAsArray };
