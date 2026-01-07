import { ObservableParam, Linked } from '@legendapp/state';

declare function numberAsString(num$: ObservableParam<number>): Linked<string>;

export { numberAsString };
