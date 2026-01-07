import { useCallback } from "react";
function useMergeRefs(...refs) {
  return useCallback(current => {
    for (const ref of refs) ref != null && (typeof ref == "function" ? ref(current) : ref.current = current);
  }, [...refs]
  // eslint-disable-line react-hooks/exhaustive-deps
  );
}
var useMergeRefs_default = useMergeRefs;
export { useMergeRefs_default as default, useMergeRefs };
//# sourceMappingURL=useMergeRefs.mjs.map
