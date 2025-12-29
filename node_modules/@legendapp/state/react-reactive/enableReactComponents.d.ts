import { FCReactiveObject, configureReactive } from '@legendapp/state/react';

declare function enableReactComponents_(config: typeof configureReactive): void;

declare module '@legendapp/state/react' {
    interface IReactive extends FCReactiveObject<JSX.IntrinsicElements> {
    }
}

export { enableReactComponents_ };
