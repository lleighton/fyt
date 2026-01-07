import { FCReactiveObject } from '@legendapp/state/react';
import { JSX } from 'react';

type IReactive = FCReactiveObject<JSX.IntrinsicElements>;
declare const $React: IReactive;

export { $React };
