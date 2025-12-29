import { ObservableParam, Linked } from '@legendapp/state';

declare function setAsString(set$: ObservableParam<Set<any>>): Linked<string>;

export { setAsString };
