import { createContext } from "react";
import { AccessibilityUtil, canUseDOM, clickProps, createDOMProps, dismissKeyboard, flattenStyle, ImageLoader, InteractionManager, isWebColor, LocaleProvider, mergeRefs, normalizeColor, Platform, processColor, processStyle, StyleSheet, TextAncestorContext, UIManager, useEvent, useHover, useLayoutEffect, useMergeRefs, usePlatformMethods } from "@tamagui/react-native-web-internals";
import { createElement } from "./createElement/index.mjs";
import { NativeModules } from "./NativeModules/index.mjs";
import { render } from "./render/index.mjs";
import { default as default2 } from "./vendor/react-native/Animated/Animated.mjs";
import { default as default3 } from "./vendor/react-native/Animated/Easing.mjs";
import { default as default4 } from "./vendor/react-native/EventEmitter/NativeEventEmitter.mjs";
import { AccessibilityInfo } from "./AccessibilityInfo/index.mjs";
import { Alert } from "./Alert/index.mjs";
import { Appearance } from "./Appearance/index.mjs";
import { AppRegistry } from "./AppRegistry/index.mjs";
import { AppState } from "./AppState/index.mjs";
import { BackHandler } from "./BackHandler/index.mjs";
import { Clipboard } from "./Clipboard/index.mjs";
import { DeviceEmitter, DeviceEmitter as DeviceEmitter2 } from "./DeviceEmitter.mjs";
import { DeviceInfo } from "./DeviceInfo/index.mjs";
import { Dimensions } from "./Dimensions/index.mjs";
import { I18nManager } from "./I18nManager/index.mjs";
import { Keyboard } from "./Keyboard/index.mjs";
import { Linking } from "./Linking/index.mjs";
import { PanResponder } from "./PanResponder/index.mjs";
import { PixelRatio } from "./PixelRatio/index.mjs";
import { Share } from "./Share/index.mjs";
import { Vibration } from "./Vibration/index.mjs";
import { FlatList } from "./FlatList.mjs";
import { SectionList } from "./SectionList.mjs";
import { VirtualizedList } from "./VirtualizedList.mjs";
import { TouchableNativeFeedback } from "./TouchableNativeFeedback.mjs";
import { UnimplementedView, UnimplementedView as UnimplementedView2, UnimplementedView as UnimplementedView3 } from "./UnimplementedView.mjs";
import { TouchableOpacity, TouchableOpacity as TouchableOpacity2 } from "./TouchableOpacity.mjs";
import { TouchableWithoutFeedback } from "./TouchableWithoutFeedback.mjs";
import { ActivityIndicator } from "./ActivityIndicator/index.mjs";
import { Image } from "./Image/index.mjs";
import { ImageBackground } from "./ImageBackground/index.mjs";
import { KeyboardAvoidingView } from "./KeyboardAvoidingView/index.mjs";
import { LogBox } from "./LogBox/index.mjs";
import { Modal } from "./Modal/index.mjs";
import { Pressable } from "./Pressable/index.mjs";
import { RefreshControl } from "./RefreshControl/index.mjs";
import { SafeAreaView } from "./SafeAreaView/index.mjs";
import { ScrollView } from "./ScrollView/index.mjs";
import { StatusBar } from "./StatusBar/index.mjs";
import { Text } from "./Text/index.mjs";
import { TextInput } from "./TextInput/index.mjs";
import { View } from "./View/index.mjs";
import { useColorScheme } from "./useColorScheme/index.mjs";
import { useLocaleContext } from "./useLocaleContext/index.mjs";
import { useWindowDimensions } from "./useWindowDimensions/index.mjs";
import { unstable_batchedUpdates } from "react-dom";
function requireNativeComponent(name) {
  return function () {
    return null;
  };
}
const findNodeHandle = component => {
    throw new Error("not supported - use ref instead");
  },
  RootTagContext = createContext(null);
export { AccessibilityInfo, AccessibilityUtil, ActivityIndicator, Alert, default2 as Animated, AppRegistry, AppState, Appearance, BackHandler, Clipboard, DeviceEmitter, DeviceEmitter2 as DeviceEventEmitter, DeviceInfo, Dimensions, UnimplementedView as DrawerLayoutAndroid, default3 as Easing, FlatList, I18nManager, Image, ImageBackground, ImageLoader, InteractionManager, Keyboard, KeyboardAvoidingView, Linking, LocaleProvider, LogBox, Modal, default4 as NativeEventEmitter, NativeModules, PanResponder, PixelRatio, Platform, Pressable, RefreshControl, RootTagContext, SafeAreaView, ScrollView, SectionList, Share, StatusBar, StyleSheet, UnimplementedView2 as Switch, Text, TextAncestorContext, TextInput, TouchableOpacity as Touchable, UnimplementedView3 as TouchableHighlight, TouchableNativeFeedback, TouchableOpacity2 as TouchableOpacity, TouchableWithoutFeedback, UIManager, Vibration, View, VirtualizedList, canUseDOM, clickProps, createDOMProps, dismissKeyboard, findNodeHandle, flattenStyle, isWebColor, mergeRefs, normalizeColor, processColor, processStyle, render, requireNativeComponent, unstable_batchedUpdates, createElement as unstable_createElement, useColorScheme, useEvent, useHover, useLayoutEffect, useLocaleContext, useMergeRefs, usePlatformMethods, useWindowDimensions };
//# sourceMappingURL=index.mjs.map
