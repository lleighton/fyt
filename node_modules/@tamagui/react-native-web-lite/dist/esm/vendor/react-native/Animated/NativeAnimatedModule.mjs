import * as TurboModuleRegistry from "../TurboModule/TurboModuleRegistry.mjs";
const EventMapping = {},
  AnimatedNodeConfig = {},
  AnimatingNodeConfig = {},
  SaveValueCallback = () => {},
  EndCallback = () => {},
  spec = {
    startOperationBatch: () => {},
    finishOperationBatch: () => {},
    createAnimatedNode: (tag, config) => {},
    updateAnimatedNodeConfig: (tag, config) => {},
    getValue: (tag, saveValueCallback) => {},
    startListeningToAnimatedNodeValue: tag => {},
    stopListeningToAnimatedNodeValue: tag => {},
    connectAnimatedNodes: (parentTag, childTag) => {},
    disconnectAnimatedNodes: (parentTag, childTag) => {},
    startAnimatingNode: (animationId, nodeTag, config, endCallback) => {},
    stopAnimation: animationId => {},
    setAnimatedNodeValue: (nodeTag, value) => {},
    setAnimatedNodeOffset: (nodeTag, offset) => {},
    flattenAnimatedNodeOffset: nodeTag => {},
    extractAnimatedNodeOffset: nodeTag => {},
    connectAnimatedNodeToView: (nodeTag, viewTag) => {},
    disconnectAnimatedNodeFromView: (nodeTag, viewTag) => {},
    restoreDefaultValues: nodeTag => {},
    dropAnimatedNode: tag => {},
    addAnimatedEventToView: (viewTag, eventName, eventMapping) => {},
    removeAnimatedEventFromView: (viewTag, eventName, animatedNodeTag) => {},
    // Events
    addListener: eventName => {},
    removeListeners: count => {},
    // All of the above in a batched mode
    queueAndExecuteBatchedOperations: operationsAndArgs => {}
  },
  NativeAnimatedNonTurboModule = TurboModuleRegistry.get("NativeAnimatedModule") || spec;
var NativeAnimatedModule_default = NativeAnimatedNonTurboModule;
export { AnimatedNodeConfig, AnimatingNodeConfig, EndCallback, EventMapping, NativeAnimatedNonTurboModule, SaveValueCallback, NativeAnimatedModule_default as default };
//# sourceMappingURL=NativeAnimatedModule.mjs.map
