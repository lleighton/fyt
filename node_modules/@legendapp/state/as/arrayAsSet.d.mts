import { ObservableParam, Linked } from '@legendapp/state';

declare function arrayAsSet<T>(arr$: ObservableParam<T[]>): Linked<Set<T>>;

export { arrayAsSet };
