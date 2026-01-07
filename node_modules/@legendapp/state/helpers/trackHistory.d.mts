import { ObservableParam } from '@legendapp/state';

type TimestampAsString = string;
declare function trackHistory<T>(value$: ObservableParam<T>, targetObservable?: ObservableParam<Record<TimestampAsString, Partial<T>>>): ObservableParam<Record<TimestampAsString, any>>;

export { trackHistory };
