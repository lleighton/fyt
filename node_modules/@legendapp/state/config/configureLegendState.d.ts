import { NodeInfo } from '@legendapp/state';

declare function configureLegendState({ observableFunctions, observableProperties, jsonReplacer, jsonReviver, }: {
    observableFunctions?: Record<string, (node: NodeInfo, ...args: any[]) => any>;
    observableProperties?: Record<string, {
        get: (node: NodeInfo) => any;
        set: (node: NodeInfo, value: any) => any;
    }>;
    jsonReplacer?: (this: any, key: string, value: any) => any;
    jsonReviver?: (this: any, key: string, value: any) => any;
}): void;

export { configureLegendState };
