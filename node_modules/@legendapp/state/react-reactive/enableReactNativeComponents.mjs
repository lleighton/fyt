import { useSelector } from '@legendapp/state/react';
import { useRef } from 'react';
import { ActivityIndicator, Button, FlatList, Image, Pressable, ScrollView, SectionList, Switch, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';

// src/react-reactive/enableReactNativeComponents.ts
var isEnabled = false;
function enableReactNativeComponents_(configure) {
  if (isEnabled) {
    return;
  }
  isEnabled = true;
  configure({
    components: {
      ActivityIndicator,
      Button,
      FlatList,
      Image,
      Pressable,
      ScrollView,
      SectionList,
      Switch,
      Text,
      TextInput,
      TouchableWithoutFeedback,
      View
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
            const state = useRef(0);
            const [renderNum, value] = useSelector(() => [state.current++, p.get(true)]);
            propsOut.extraData = renderNum;
            return value;
          }
        }
      }
    }
  });
}

export { enableReactNativeComponents_ };
