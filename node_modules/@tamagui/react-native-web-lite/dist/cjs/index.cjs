var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf,
  __hasOwnProp = Object.prototype.hasOwnProperty;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
    value: mod,
    enumerable: !0
  }) : target, mod)),
  __toCommonJS = mod => __copyProps(__defProp({}, "__esModule", {
    value: !0
  }), mod);
var index_exports = {};
__export(index_exports, {
  AccessibilityInfo: () => import_AccessibilityInfo.AccessibilityInfo,
  AccessibilityUtil: () => import_react_native_web_internals.AccessibilityUtil,
  ActivityIndicator: () => import_ActivityIndicator.ActivityIndicator,
  Alert: () => import_Alert.Alert,
  Animated: () => import_Animated.default,
  AppRegistry: () => import_AppRegistry.AppRegistry,
  AppState: () => import_AppState.AppState,
  Appearance: () => import_Appearance.Appearance,
  BackHandler: () => import_BackHandler.BackHandler,
  Clipboard: () => import_Clipboard.Clipboard,
  DeviceEmitter: () => import_DeviceEmitter.DeviceEmitter,
  DeviceEventEmitter: () => import_DeviceEmitter.DeviceEmitter,
  DeviceInfo: () => import_DeviceInfo.DeviceInfo,
  Dimensions: () => import_Dimensions.Dimensions,
  DrawerLayoutAndroid: () => import_UnimplementedView.UnimplementedView,
  Easing: () => import_Easing.default,
  FlatList: () => import_FlatList.FlatList,
  I18nManager: () => import_I18nManager.I18nManager,
  Image: () => import_Image.Image,
  ImageBackground: () => import_ImageBackground.ImageBackground,
  ImageLoader: () => import_react_native_web_internals.ImageLoader,
  InteractionManager: () => import_react_native_web_internals.InteractionManager,
  Keyboard: () => import_Keyboard.Keyboard,
  KeyboardAvoidingView: () => import_KeyboardAvoidingView.KeyboardAvoidingView,
  Linking: () => import_Linking.Linking,
  LocaleProvider: () => import_react_native_web_internals.LocaleProvider,
  LogBox: () => import_LogBox.LogBox,
  Modal: () => import_Modal.Modal,
  NativeEventEmitter: () => import_NativeEventEmitter.default,
  NativeModules: () => import_NativeModules.NativeModules,
  PanResponder: () => import_PanResponder.PanResponder,
  PixelRatio: () => import_PixelRatio.PixelRatio,
  Platform: () => import_react_native_web_internals.Platform,
  Pressable: () => import_Pressable.Pressable,
  RefreshControl: () => import_RefreshControl.RefreshControl,
  RootTagContext: () => RootTagContext,
  SafeAreaView: () => import_SafeAreaView.SafeAreaView,
  ScrollView: () => import_ScrollView.ScrollView,
  SectionList: () => import_SectionList.SectionList,
  Share: () => import_Share.Share,
  StatusBar: () => import_StatusBar.StatusBar,
  StyleSheet: () => import_react_native_web_internals.StyleSheet,
  Switch: () => import_UnimplementedView.UnimplementedView,
  Text: () => import_Text.Text,
  TextAncestorContext: () => import_react_native_web_internals.TextAncestorContext,
  TextInput: () => import_TextInput.TextInput,
  Touchable: () => import_TouchableOpacity.TouchableOpacity,
  TouchableHighlight: () => import_UnimplementedView.UnimplementedView,
  TouchableNativeFeedback: () => import_TouchableNativeFeedback.TouchableNativeFeedback,
  TouchableOpacity: () => import_TouchableOpacity.TouchableOpacity,
  TouchableWithoutFeedback: () => import_TouchableWithoutFeedback.TouchableWithoutFeedback,
  UIManager: () => import_react_native_web_internals.UIManager,
  Vibration: () => import_Vibration.Vibration,
  View: () => import_View.View,
  VirtualizedList: () => import_VirtualizedList.VirtualizedList,
  canUseDOM: () => import_react_native_web_internals.canUseDOM,
  clickProps: () => import_react_native_web_internals.clickProps,
  createDOMProps: () => import_react_native_web_internals.createDOMProps,
  dismissKeyboard: () => import_react_native_web_internals.dismissKeyboard,
  findNodeHandle: () => findNodeHandle,
  flattenStyle: () => import_react_native_web_internals.flattenStyle,
  isWebColor: () => import_react_native_web_internals.isWebColor,
  mergeRefs: () => import_react_native_web_internals.mergeRefs,
  normalizeColor: () => import_react_native_web_internals.normalizeColor,
  processColor: () => import_react_native_web_internals.processColor,
  processStyle: () => import_react_native_web_internals.processStyle,
  render: () => import_render.render,
  requireNativeComponent: () => requireNativeComponent,
  unstable_batchedUpdates: () => import_react_dom.unstable_batchedUpdates,
  unstable_createElement: () => import_createElement.createElement,
  useColorScheme: () => import_useColorScheme.useColorScheme,
  useEvent: () => import_react_native_web_internals.useEvent,
  useHover: () => import_react_native_web_internals.useHover,
  useLayoutEffect: () => import_react_native_web_internals.useLayoutEffect,
  useLocaleContext: () => import_useLocaleContext.useLocaleContext,
  useMergeRefs: () => import_react_native_web_internals.useMergeRefs,
  usePlatformMethods: () => import_react_native_web_internals.usePlatformMethods,
  useWindowDimensions: () => import_useWindowDimensions.useWindowDimensions
});
module.exports = __toCommonJS(index_exports);
var import_react = require("react"),
  import_react_native_web_internals = require("@tamagui/react-native-web-internals"),
  import_createElement = require("./createElement/index.cjs"),
  import_NativeModules = require("./NativeModules/index.cjs"),
  import_render = require("./render/index.cjs"),
  import_Animated = __toESM(require("./vendor/react-native/Animated/Animated.cjs"), 1),
  import_Easing = __toESM(require("./vendor/react-native/Animated/Easing.cjs"), 1),
  import_NativeEventEmitter = __toESM(require("./vendor/react-native/EventEmitter/NativeEventEmitter.cjs"), 1),
  import_AccessibilityInfo = require("./AccessibilityInfo/index.cjs"),
  import_Alert = require("./Alert/index.cjs"),
  import_Appearance = require("./Appearance/index.cjs"),
  import_AppRegistry = require("./AppRegistry/index.cjs"),
  import_AppState = require("./AppState/index.cjs"),
  import_BackHandler = require("./BackHandler/index.cjs"),
  import_Clipboard = require("./Clipboard/index.cjs"),
  import_DeviceEmitter = require("./DeviceEmitter.cjs"),
  import_DeviceInfo = require("./DeviceInfo/index.cjs"),
  import_Dimensions = require("./Dimensions/index.cjs"),
  import_I18nManager = require("./I18nManager/index.cjs"),
  import_Keyboard = require("./Keyboard/index.cjs"),
  import_Linking = require("./Linking/index.cjs"),
  import_PanResponder = require("./PanResponder/index.cjs"),
  import_PixelRatio = require("./PixelRatio/index.cjs"),
  import_Share = require("./Share/index.cjs"),
  import_Vibration = require("./Vibration/index.cjs"),
  import_FlatList = require("./FlatList.cjs"),
  import_SectionList = require("./SectionList.cjs"),
  import_VirtualizedList = require("./VirtualizedList.cjs"),
  import_TouchableNativeFeedback = require("./TouchableNativeFeedback.cjs"),
  import_UnimplementedView = require("./UnimplementedView.cjs"),
  import_TouchableOpacity = require("./TouchableOpacity.cjs"),
  import_TouchableWithoutFeedback = require("./TouchableWithoutFeedback.cjs"),
  import_ActivityIndicator = require("./ActivityIndicator/index.cjs"),
  import_Image = require("./Image/index.cjs"),
  import_ImageBackground = require("./ImageBackground/index.cjs"),
  import_KeyboardAvoidingView = require("./KeyboardAvoidingView/index.cjs"),
  import_LogBox = require("./LogBox/index.cjs"),
  import_Modal = require("./Modal/index.cjs"),
  import_Pressable = require("./Pressable/index.cjs"),
  import_RefreshControl = require("./RefreshControl/index.cjs"),
  import_SafeAreaView = require("./SafeAreaView/index.cjs"),
  import_ScrollView = require("./ScrollView/index.cjs"),
  import_StatusBar = require("./StatusBar/index.cjs"),
  import_Text = require("./Text/index.cjs"),
  import_TextInput = require("./TextInput/index.cjs"),
  import_View = require("./View/index.cjs"),
  import_useColorScheme = require("./useColorScheme/index.cjs"),
  import_useLocaleContext = require("./useLocaleContext/index.cjs"),
  import_useWindowDimensions = require("./useWindowDimensions/index.cjs"),
  import_react_dom = require("react-dom");
function requireNativeComponent(name) {
  return function () {
    return null;
  };
}
const findNodeHandle = component => {
    throw new Error("not supported - use ref instead");
  },
  RootTagContext = (0, import_react.createContext)(null);