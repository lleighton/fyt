import { ObservableParam, Linked } from '@legendapp/state';

declare function stringAsSet<T>(str$: ObservableParam<string>): Linked<Set<T>>;

export { stringAsSet };
