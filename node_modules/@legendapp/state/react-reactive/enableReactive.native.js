'use strict';

var react$1 = require('@legendapp/state/react');
var react = require('react');
var reactNative = require('react-native');

// src/react-reactive/enableReactNativeComponents.ts
var isEnabled = false;
function enableReactNativeComponents_(configure) {
  if (isEnabled) {
    return;
  }
  isEnabled = true;
  configure({
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
            const state = react.useRef(0);
            const [renderNum, value] = react$1.useSelector(() => [state.current++, p.get(true)]);
            propsOut.extraData = renderNum;
            return value;
          }
        }
      }
    }
  });
}

// src/react-reactive/enableReactive.native.ts
function enableReactive(configure) {
  enableReactNativeComponents_(configure);
}

exports.enableReactive = enableReactive;
