'use strict';

var react = require('@legendapp/state/react');
var react$1 = require('react');
var reactNative = require('react-native');

// src/react-reactive/Components.ts
var $ActivityIndicator = react.reactive(reactNative.ActivityIndicator);
var $Button = react.reactive(reactNative.Button);
var $FlatList = react.reactive(reactNative.FlatList, void 0, {
  data: {
    selector: (propsOut, p) => {
      const state = react$1.useRef(0);
      const [renderNum, value] = react.use$(() => [state.current++, p.get(true)]);
      propsOut.extraData = renderNum;
      return value;
    }
  }
});
var $Image = react.reactive(reactNative.Image);
var $Pressable = react.reactive(reactNative.Pressable);
var $ScrollView = react.reactive(reactNative.ScrollView);
var $SectionList = react.reactive(reactNative.SectionList);
var $Switch = react.reactive(reactNative.Switch, void 0, {
  value: {
    handler: "onValueChange",
    getValue: (e) => e,
    defaultValue: false
  }
});
var $Text = react.reactive(reactNative.Text);
var $TextInput = react.reactive(reactNative.TextInput, void 0, {
  value: {
    handler: "onChange",
    getValue: (e) => e.nativeEvent.text,
    defaultValue: ""
  }
});
var $TouchableWithoutFeedback = react.reactive(reactNative.TouchableWithoutFeedback);
var $View = react.reactive(reactNative.View);

exports.$ActivityIndicator = $ActivityIndicator;
exports.$Button = $Button;
exports.$FlatList = $FlatList;
exports.$Image = $Image;
exports.$Pressable = $Pressable;
exports.$ScrollView = $ScrollView;
exports.$SectionList = $SectionList;
exports.$Switch = $Switch;
exports.$Text = $Text;
exports.$TextInput = $TextInput;
exports.$TouchableWithoutFeedback = $TouchableWithoutFeedback;
exports.$View = $View;
