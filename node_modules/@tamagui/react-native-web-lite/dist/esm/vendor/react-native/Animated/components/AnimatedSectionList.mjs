import * as React from "react";
import { SectionList as SectionListComponent } from "../../../../SectionList.mjs";
import { createAnimatedComponent } from "../createAnimatedComponent.mjs";
import { jsx } from "react/jsx-runtime";
const SectionListWithEventThrottle = React.forwardRef((props, ref) => /* @__PURE__ */jsx(SectionListComponent, {
    scrollEventThrottle: 1e-4,
    ...props,
    ref
  })),
  SectionList = createAnimatedComponent(SectionListWithEventThrottle);
var AnimatedSectionList_default = SectionList;
export { SectionList, AnimatedSectionList_default as default };
//# sourceMappingURL=AnimatedSectionList.mjs.map
