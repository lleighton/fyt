import * as React from 'react';
import { ReactNode, ReactElement, FC, NamedExoticComponent, LegacyRef, DependencyList, ReducerWithoutAction, ReducerStateWithoutAction, DispatchWithoutAction, Reducer, ReducerState, Dispatch, ReducerAction, ComponentClass } from 'react';
import { ObservableParam, Observable, ObservableBoolean, Selector, GetOptions, RecursiveValueOrFunction, ObserveOptions, ObserveEvent, ObserveEventCallback } from '@legendapp/state';

declare function Computed({ children }: {
    children: ObservableParam | (() => ReactNode);
}): ReactElement;

type ForItemProps<T, TProps = {}> = {
    item$: Observable<T>;
    id?: string;
} & TProps;
declare function For<T, TProps>({ each, optimized: isOptimized, item, itemProps, sortValues, children, }: {
    each?: ObservableParam<T[] | Record<any, T> | Map<any, T>>;
    optimized?: boolean;
    item?: FC<ForItemProps<T, TProps>>;
    itemProps?: TProps;
    sortValues?: (A: T, B: T, AKey: string, BKey: string) => number;
    children?: (value: Observable<T>, id: string | undefined) => ReactElement;
}): ReactElement | null;

declare function usePauseProvider(): {
    PauseProvider: ({ children }: {
        children: ReactNode;
    }) => React.FunctionComponentElement<React.ProviderProps<ObservableBoolean>>;
    isPaused$: ObservableBoolean;
};

declare const Memo: NamedExoticComponent<{
    children: any;
    scoped?: boolean;
}>;

interface IReactive {
}
declare const Reactive: IReactive;

interface PropsIf<T> {
    if: Selector<T>;
    ifReady?: never;
}
interface PropsIfReady<T> {
    if?: never;
    ifReady: Selector<T>;
}
interface PropsBase<T> {
    else?: ReactNode | (() => ReactNode);
    $value?: Observable<T>;
    wrap?: FC<{
        children: ReactNode;
    }>;
    children: ReactNode | ((value?: T) => ReactNode);
}
type Props<T> = PropsBase<T> & (PropsIf<T> | PropsIfReady<T>);
declare function Show<T>(props: Props<T>): ReactElement;

declare function Switch<T extends object>({ value, children, }: {
    value?: Selector<T>;
    children: Partial<Record<keyof T | 'null' | 'undefined' | 'default', () => ReactNode>>;
}): ReactElement | null;
declare function Switch<T extends string | number | symbol>({ value, children, }: {
    value?: Selector<T | undefined | null>;
    children: Partial<Record<T | 'null' | 'undefined' | 'default', () => ReactNode>>;
}): ReactElement | null;
declare function Switch<T extends boolean>({ value, children, }: {
    value?: Selector<T | undefined | null>;
    children: Partial<Record<'false' | 'true' | 'null' | 'undefined' | 'default', () => ReactNode>>;
}): ReactElement | null;
declare function Switch<T>({ value, children, }: {
    value?: Selector<T>;
    children: Partial<Record<'undefined' | 'default', () => ReactNode>>;
}): ReactElement | null;

type ShapeWithNew$<T> = Partial<Omit<T, 'children'>> & {
    [K in keyof T as K extends `$${string & K}` ? K : `$${string & K}`]?: Selector<T[K]>;
} & {
    children?: Selector<ReactNode>;
};
interface BindKey<P, K extends keyof P = keyof P> {
    handler?: K;
    getValue?: P[K] extends infer T ? T extends (...args: any) => any ? (params: Parameters<T>[0]) => any : (e: any) => any : (e: any) => any;
    defaultValue?: any;
    selector?: (propsOut: Record<string, any>, p: Observable<any>) => any;
}
type BindKeys<P = any, K extends keyof P = keyof P> = Partial<Record<K, BindKey<P>>>;
type FCReactiveObject<T> = {
    [K in keyof T]: FC<ShapeWithNew$<T[K]>>;
};
type FCReactive<P, P2> = P & FC<ShapeWithNew$<P2> & {
    ref?: LegacyRef<P> | undefined;
}>;
interface UseSelectorOptions extends GetOptions {
    suspense?: boolean;
    skipCheck?: boolean;
}

type WithSelectorChildren<T> = T extends any ? T extends {
    children?: infer C;
} ? Omit<T, 'children'> & {
    children?: C | Selector<C>;
} : T extends {
    children: infer C;
} ? Omit<T, 'children'> & {
    children: C | Selector<C>;
} : T : never;
type ShapeWith$<T> = WithSelectorChildren<Partial<T>> & {
    [K in keyof T as K extends `$${string & K}` ? K : `$${string & K}`]?: Selector<T[K]>;
};
type ObjectShapeWith$<T> = {
    [K in keyof T]: T[K] extends FC<infer P> ? FC<ShapeWith$<P>> : T[K];
};
type ReactifyProps<T, K extends keyof T> = T & {
    [P in K as `$${string & P}`]?: Selector<T[P]>;
};
declare const hasSymbol: false | ((key: string) => symbol);
declare function observer<P extends FC<any>>(component: P): P;
declare function reactive<T extends object>(component: React.ComponentClass<T>, keys: undefined | null, bindKeys?: BindKeys<T>): React.FC<ShapeWith$<T>>;
declare function reactive<T extends object>(component: React.FC<T>, keys: undefined | null, bindKeys?: BindKeys<T>): React.FC<ShapeWith$<T>>;
declare function reactive<T extends object>(component: React.ForwardRefExoticComponent<T>, keys: undefined | null, bindKeys?: BindKeys<T>): React.ForwardRefExoticComponent<ShapeWith$<T>>;
declare function reactive<T extends object, K extends keyof T>(component: React.FC<T>, keys: K[] | (keyof T)[], bindKeys?: BindKeys<T, K>): React.FC<ReactifyProps<T, K>>;
declare function reactive<T extends object, K extends keyof T>(component: React.ForwardRefExoticComponent<T>, keys: K[] | (keyof T)[], bindKeys?: BindKeys<T, K>): React.ForwardRefExoticComponent<ReactifyProps<T, K>>;
declare function reactive<T extends object>(component: React.ComponentClass<T>): React.ComponentClass<ShapeWith$<T>>;
declare function reactive<T extends object>(component: React.FC<T>): React.FC<ShapeWith$<T>>;
declare function reactive<T extends object>(component: React.ForwardRefExoticComponent<T>): React.ForwardRefExoticComponent<ShapeWith$<T>>;
declare function reactiveObserver<T extends object>(component: React.FC<T>, keys: undefined | null, bindKeys?: BindKeys<T>): React.FC<ShapeWith$<T>>;
declare function reactiveObserver<T extends object>(component: React.ForwardRefExoticComponent<T>, keys: undefined | null, bindKeys?: BindKeys<T>): React.ForwardRefExoticComponent<ShapeWith$<T>>;
declare function reactiveObserver<T extends object, K extends keyof T>(component: React.FC<T>, keys: K[] | (keyof T)[], bindKeys?: BindKeys<T, K>): React.FC<ReactifyProps<T, K>>;
declare function reactiveObserver<T extends object, K extends keyof T>(component: React.ForwardRefExoticComponent<T>, keys: K[] | (keyof T)[], bindKeys?: BindKeys<T, K>): React.ForwardRefExoticComponent<ReactifyProps<T, K>>;
declare function reactiveObserver<T extends object>(component: React.FC<T>): React.FC<ShapeWith$<T>>;
declare function reactiveObserver<T extends object>(component: React.ForwardRefExoticComponent<T>): React.ForwardRefExoticComponent<ShapeWith$<T>>;
declare function reactiveComponents<P extends Record<string, any>>(components: P): ObjectShapeWith$<P>;

declare function useComputed<T>(get: () => T | Promise<T>): Observable<T>;
declare function useComputed<T>(get: () => T | Promise<T>, deps: any[]): Observable<T>;
declare function useComputed<T, T2 = T>(get: (() => T | Promise<T>) | ObservableParam<T>, set: (value: T2) => void): Observable<T>;
declare function useComputed<T, T2 = T>(get: (() => T | Promise<T>) | ObservableParam<T>, set: (value: T2) => void, deps: any[]): Observable<T>;

declare const useEffectOnce: (effect: () => void | (() => void), deps: any[]) => void;

declare function useIsMounted(): Observable<boolean>;

declare function useMount(fn: () => (void | (() => void)) | Promise<void>): void;
declare const useMountOnce: typeof useMount;

/**
 * A React hook that creates a new observable
 *
 * @param initialValue The initial value of the observable or a function that returns the initial value
 *
 * @see https://www.legendapp.com/dev/state/react/#useObservable
 */
declare function useObservable<T>(): Observable<T | undefined>;
declare function useObservable<T>(value: Promise<RecursiveValueOrFunction<T>> | (() => RecursiveValueOrFunction<T>) | RecursiveValueOrFunction<T>, deps?: DependencyList): Observable<T>;
declare function useObservable<T>(value: T, deps?: DependencyList): Observable<T>;
declare function useObservable<T>(value?: T, deps?: DependencyList): Observable<any>;

declare function useObservableReducer<R extends ReducerWithoutAction<any>, I>(reducer: R, initializerArg: I, initializer: (arg: I) => ReducerStateWithoutAction<R>): [Observable<ReducerStateWithoutAction<R>>, DispatchWithoutAction];
declare function useObservableReducer<R extends ReducerWithoutAction<any>>(reducer: R, initializerArg: ReducerStateWithoutAction<R>, initializer?: undefined): [Observable<ReducerStateWithoutAction<R>>, DispatchWithoutAction];
declare function useObservableReducer<R extends Reducer<any, any>, I>(reducer: R, initializerArg: I & ReducerState<R>, initializer: (arg: I & ReducerState<R>) => ReducerState<R>): [Observable<ReducerState<R>>, Dispatch<ReducerAction<R>>];
declare function useObservableReducer<R extends Reducer<any, any>, I>(reducer: R, initializerArg: I, initializer: (arg: I) => ReducerState<R>): [Observable<ReducerState<R>>, Dispatch<ReducerAction<R>>];
declare function useObservableReducer<R extends Reducer<any, any>>(reducer: R, initialState: ReducerState<R>, initializer?: undefined): [Observable<ReducerState<R>>, Dispatch<ReducerAction<R>>];

interface UseObserveOptions extends ObserveOptions {
    deps?: any[];
}
declare function useObserve<T>(run: (e: ObserveEvent<T>) => T | void): () => void;
declare function useObserve<T>(run: (e: ObserveEvent<T>) => T | void, deps?: any[]): () => void;
declare function useObserve<T>(run: (e: ObserveEvent<T>) => T | void, options?: UseObserveOptions): () => void;
declare function useObserve<T>(run: (e: ObserveEvent<T>) => T | void, options?: UseObserveOptions, deps?: any[]): () => void;
declare function useObserve<T>(selector: Selector<T>, reaction?: (e: ObserveEventCallback<T>) => any, options?: UseObserveOptions): () => void;
declare function useObserve<T>(selector: Selector<T>, reaction?: (e: ObserveEventCallback<T>) => any, options?: UseObserveOptions, deps?: any[]): () => void;

declare function useObserveEffect<T>(run: (e: ObserveEvent<T>) => T | void): void;
declare function useObserveEffect<T>(run: (e: ObserveEvent<T>) => T | void, deps?: any[]): void;
declare function useObserveEffect<T>(run: (e: ObserveEvent<T>) => T | void, options?: UseObserveOptions): void;
declare function useObserveEffect<T>(run: (e: ObserveEvent<T>) => T | void, options?: UseObserveOptions, deps?: any[]): void;
declare function useObserveEffect<T>(selector: Selector<T>, reaction?: (e: ObserveEventCallback<T>) => any, options?: UseObserveOptions): void;
declare function useObserveEffect<T>(selector: Selector<T>, reaction?: (e: ObserveEventCallback<T>) => any, options?: UseObserveOptions, deps?: any[]): void;

declare function useSelector<T>(selector: Selector<T>, options?: UseSelectorOptions): T;

declare function useUnmount(fn: () => void): void;
declare const useUnmountOnce: typeof useUnmount;

declare function useWhen<T>(predicate: Selector<T>): Promise<T>;
declare function useWhen<T, T2>(predicate: Selector<T>, effect: (value: T) => T2): Promise<T2>;
declare function useWhenReady<T>(predicate: Selector<T>): Promise<T>;
declare function useWhenReady<T, T2>(predicate: Selector<T>, effect: (value: T) => T2 | (() => T2)): Promise<T2>;

declare function configureReactive({ components, binders, }: {
    components?: Record<string, FC | ComponentClass<any>>;
    binders?: Record<string, BindKeys>;
}): void;

export { type BindKey, type BindKeys, Computed, type FCReactive, type FCReactiveObject, For, type IReactive, Memo, type ObjectShapeWith$, type ReactifyProps, Reactive, type ShapeWith$, type ShapeWithNew$, Show, Switch, type UseObserveOptions, type UseSelectorOptions, configureReactive, hasSymbol, observer, reactive, reactiveComponents, reactiveObserver, useSelector as use$, useComputed, useEffectOnce, useIsMounted, useObservable as useLocalObservable, useMount, useMountOnce, useObservable, useObservableReducer, useObserve, useObserveEffect, usePauseProvider, useSelector, useUnmount, useUnmountOnce, useSelector as useValue, useWhen, useWhenReady };
