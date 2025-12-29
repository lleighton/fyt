import React from "react";
import { canUseDOM } from "../canUseDOM.mjs";
const useLayoutEffectImpl = canUseDOM ? React.useLayoutEffect : React.useEffect;
export { useLayoutEffectImpl };
//# sourceMappingURL=index.mjs.map
