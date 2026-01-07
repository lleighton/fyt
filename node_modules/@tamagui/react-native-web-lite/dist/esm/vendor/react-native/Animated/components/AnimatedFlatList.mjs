import * as React from "react";
import { FlatList as FlatListComponent } from "../../../../FlatList.mjs";
import { createAnimatedComponent } from "../createAnimatedComponent.mjs";
import { jsx } from "react/jsx-runtime";
const FlatListWithEventThrottle = React.forwardRef((props, ref) => /* @__PURE__ */jsx(FlatListComponent, {
    scrollEventThrottle: 1e-4,
    ...props,
    ref
  })),
  FlatList = createAnimatedComponent(FlatListWithEventThrottle);
var AnimatedFlatList_default = FlatList;
export { FlatList, AnimatedFlatList_default as default };
//# sourceMappingURL=AnimatedFlatList.mjs.map
