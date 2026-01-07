import { configureReactive } from '@legendapp/state/react';

declare function enableReactive(config: typeof configureReactive): void;

export { enableReactive };
