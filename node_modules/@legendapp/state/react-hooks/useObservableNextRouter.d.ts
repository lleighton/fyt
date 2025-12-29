import { Observable } from '@legendapp/state';
import { NextRouter } from 'next/router';

type ParsedUrlQuery = {
    [key: string]: string | string[] | undefined;
};
interface TransitionOptions {
    shallow?: boolean;
    locale?: string | false;
    scroll?: boolean;
    unstable_skipClientCache?: boolean;
}
interface ObservableNextRouterState {
    pathname: string;
    hash: string;
    query: ParsedUrlQuery;
}
type RouteInfo = Partial<ObservableNextRouterState>;
interface ParamsUseObservableNextRouterBase {
    transitionOptions?: TransitionOptions;
    method?: 'push' | 'replace';
    subscribe?: boolean;
}
interface ParamsUseObservableNextRouter<T extends object> extends ParamsUseObservableNextRouterBase {
    compute: (value: ObservableNextRouterState) => T;
    set: (value: T, previous: T, router: NextRouter) => RouteInfo & {
        transitionOptions?: TransitionOptions;
        method?: 'push' | 'replace';
    };
}
declare function useObservableNextRouter(): Observable<ObservableNextRouterState>;
declare function useObservableNextRouter<T extends object>(params: ParamsUseObservableNextRouter<T>): Observable<T>;
declare function useObservableNextRouter(params: ParamsUseObservableNextRouterBase): Observable<ObservableNextRouterState>;

export { type ObservableNextRouterState, type ParamsUseObservableNextRouter, type ParamsUseObservableNextRouterBase, useObservableNextRouter };
