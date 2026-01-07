var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
    for (var name in all) __defProp(target, name, {
      get: all[name],
      enumerable: !0
    });
  },
  __copyProps = (to, from, except, desc) => {
    if (from && typeof from == "object" || typeof from == "function") for (let key of __getOwnPropNames(from)) !__hasOwnProp.call(to, key) && key !== except && __defProp(to, key, {
      get: () => from[key],
      enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
    });
    return to;
  };
var __toCommonJS = mod => __copyProps(__defProp({}, "__esModule", {
  value: !0
}), mod);
var Animated_exports = {};
__export(Animated_exports, {
  AnimatedExports: () => AnimatedExports,
  default: () => Animated_default
});
module.exports = __toCommonJS(Animated_exports);
var import_react_native_web_internals = require("@tamagui/react-native-web-internals"),
  import_AnimatedImplementation = require("./AnimatedImplementation.cjs"),
  import_AnimatedMock = require("./AnimatedMock.cjs"),
  import_AnimatedFlatList = require("./components/AnimatedFlatList.cjs"),
  import_AnimatedImage = require("./components/AnimatedImage.cjs"),
  import_AnimatedScrollView = require("./components/AnimatedScrollView.cjs"),
  import_AnimatedSectionList = require("./components/AnimatedSectionList.cjs"),
  import_AnimatedText = require("./components/AnimatedText.cjs"),
  import_AnimatedView = require("./components/AnimatedView.cjs");
const Animated = import_react_native_web_internals.Platform.isTesting ? import_AnimatedMock.AnimatedMock : import_AnimatedImplementation.AnimatedImplementation,
  AnimatedExports = {
    FlatList: import_AnimatedFlatList.FlatList,
    Image: import_AnimatedImage.AnimatedImage,
    ScrollView: import_AnimatedScrollView.ScrollView,
    SectionList: import_AnimatedSectionList.SectionList,
    Text: import_AnimatedText.AnimatedText,
    View: import_AnimatedView.AnimatedView,
    ...Animated
  };
var Animated_default = AnimatedExports;