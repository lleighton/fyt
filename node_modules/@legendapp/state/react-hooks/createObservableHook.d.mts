import { Observable } from '@legendapp/state';

declare function createObservableHook<TArgs extends any[], TRet>(fn: (...args: TArgs) => TRet): (...args: TArgs) => Observable<TRet>;

export { createObservableHook };
