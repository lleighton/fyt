import { ObservableParam, Linked } from '@legendapp/state';

declare function stringAsNumber(num$: ObservableParam<string>): Linked<number>;

export { stringAsNumber };
