import { useCallback, useRef } from "react";
function useRefEffect(effect) {
  const cleanupRef = useRef(void 0);
  return useCallback(instance => {
    cleanupRef.current && (cleanupRef.current(), cleanupRef.current = void 0), instance != null && (cleanupRef.current = effect(instance));
  }, [effect]);
}
var useRefEffect_default = useRefEffect;
export { useRefEffect_default as default, useRefEffect };
//# sourceMappingURL=useRefEffect.mjs.map
