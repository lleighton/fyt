import { configureReactive } from '@legendapp/state/react';

declare function enableReactive(configure: typeof configureReactive): void;

export { enableReactive };
