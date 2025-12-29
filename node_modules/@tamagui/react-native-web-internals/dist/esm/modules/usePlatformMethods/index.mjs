import { createMeasure, createMeasureInWindow, createMeasureLayout } from "@tamagui/use-element-layout";
import { useStable } from "../useStable/index.mjs";
function usePlatformMethods({
  pointerEvents,
  style
}) {
  return useStable(() => hostNode => {
    hostNode != null && (hostNode.measure = createMeasure(hostNode), hostNode.measureLayout = createMeasureLayout(hostNode), hostNode.measureInWindow = createMeasureInWindow(hostNode));
  });
}
export { usePlatformMethods };
//# sourceMappingURL=index.mjs.map
