'use strict';

var react$1 = require('react');
var react = require('@legendapp/state/react');
var reactNative = require('react-native');

// src/config/enableReactNativeComponents.ts
function enableReactNativeComponents() {
  react.configureReactive({
    components: {
      ActivityIndicator: reactNative.ActivityIndicator,
      Button: reactNative.Button,
      FlatList: reactNative.FlatList,
      Image: reactNative.Image,
      Pressable: reactNative.Pressable,
      ScrollView: reactNative.ScrollView,
      SectionList: reactNative.SectionList,
      Switch: reactNative.Switch,
      Text: reactNative.Text,
      TextInput: reactNative.TextInput,
      TouchableWithoutFeedback: reactNative.TouchableWithoutFeedback,
      View: reactNative.View
    },
    binders: {
      TextInput: {
        value: {
          handler: "onChange",
          getValue: (e) => e.nativeEvent.text,
          defaultValue: ""
        }
      },
      Switch: {
        value: {
          handler: "onValueChange",
          getValue: (e) => e,
          defaultValue: false
        }
      },
      FlatList: {
        data: {
          selector: (propsOut, p) => {
            const state = react$1.useRef(0);
            const [renderNum, value] = react.useSelector(() => [state.current++, p.get(true)]);
            propsOut.extraData = renderNum;
            return value;
          }
        }
      }
    }
  });
}

exports.enableReactNativeComponents = enableReactNativeComponents;
