import { FCReactiveObject } from '@legendapp/state/react';

declare function enableReactComponents(): void;
declare module '@legendapp/state/react' {
    interface IReactive extends FCReactiveObject<JSX.IntrinsicElements> {
    }
}

export { enableReactComponents };
