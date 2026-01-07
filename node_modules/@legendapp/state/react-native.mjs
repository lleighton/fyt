import { reactive, use$ } from '@legendapp/state/react';
import { useRef } from 'react';
import { ActivityIndicator, Button, FlatList, Image, Pressable, ScrollView, SectionList, Switch, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';

// src/react-reactive/Components.ts
var $ActivityIndicator = reactive(ActivityIndicator);
var $Button = reactive(Button);
var $FlatList = reactive(FlatList, void 0, {
  data: {
    selector: (propsOut, p) => {
      const state = useRef(0);
      const [renderNum, value] = use$(() => [state.current++, p.get(true)]);
      propsOut.extraData = renderNum;
      return value;
    }
  }
});
var $Image = reactive(Image);
var $Pressable = reactive(Pressable);
var $ScrollView = reactive(ScrollView);
var $SectionList = reactive(SectionList);
var $Switch = reactive(Switch, void 0, {
  value: {
    handler: "onValueChange",
    getValue: (e) => e,
    defaultValue: false
  }
});
var $Text = reactive(Text);
var $TextInput = reactive(TextInput, void 0, {
  value: {
    handler: "onChange",
    getValue: (e) => e.nativeEvent.text,
    defaultValue: ""
  }
});
var $TouchableWithoutFeedback = reactive(TouchableWithoutFeedback);
var $View = reactive(View);

export { $ActivityIndicator, $Button, $FlatList, $Image, $Pressable, $ScrollView, $SectionList, $Switch, $Text, $TextInput, $TouchableWithoutFeedback, $View };
