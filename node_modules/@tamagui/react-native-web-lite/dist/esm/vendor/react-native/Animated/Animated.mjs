import { Platform } from "@tamagui/react-native-web-internals";
import { AnimatedImplementation } from "./AnimatedImplementation.mjs";
import { AnimatedMock } from "./AnimatedMock.mjs";
import { FlatList } from "./components/AnimatedFlatList.mjs";
import { AnimatedImage as Image } from "./components/AnimatedImage.mjs";
import { ScrollView } from "./components/AnimatedScrollView.mjs";
import { SectionList } from "./components/AnimatedSectionList.mjs";
import { AnimatedText as Text } from "./components/AnimatedText.mjs";
import { AnimatedView as View } from "./components/AnimatedView.mjs";
const Animated = Platform.isTesting ? AnimatedMock : AnimatedImplementation,
  AnimatedExports = {
    FlatList,
    Image,
    ScrollView,
    SectionList,
    Text,
    View,
    ...Animated
  };
var Animated_default = AnimatedExports;
export { AnimatedExports, Animated_default as default };
//# sourceMappingURL=Animated.mjs.map
