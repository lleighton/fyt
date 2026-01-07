import { ObservableParam, Linked } from '@legendapp/state';

declare function arrayAsString<T extends any[]>(arr$: ObservableParam<T>): Linked<string>;

export { arrayAsString };
