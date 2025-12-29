import { FCReactiveObject, FCReactive } from '@legendapp/state/react';
import { ActivityIndicator, ActivityIndicatorProps, Button, ButtonProps, FlatList, FlatListProps, Image, ImageProps, Pressable, PressableProps, ScrollView, ScrollViewProps, SectionList, SectionListProps, Switch, SwitchProps, Text, TextProps, TextInput, TextInputProps, TouchableWithoutFeedback, TouchableWithoutFeedbackProps, View, ViewProps } from 'react-native';

declare function enableReactNativeComponents(): void;
declare module '@legendapp/state/react' {
    interface IReactive extends FCReactiveObject<JSX.IntrinsicElements> {
        ActivityIndicator: FCReactive<ActivityIndicator, ActivityIndicatorProps>;
        Button: FCReactive<Button, ButtonProps>;
        FlatList: FCReactive<FlatList, FlatListProps<any>>;
        Image: FCReactive<Image, ImageProps>;
        Pressable: FCReactive<typeof Pressable, PressableProps>;
        ScrollView: FCReactive<ScrollView, ScrollViewProps>;
        SectionList: FCReactive<SectionList, SectionListProps<any>>;
        Switch: FCReactive<Switch, SwitchProps>;
        Text: FCReactive<Text, TextProps>;
        TextInput: FCReactive<TextInput, TextInputProps>;
        TouchableWithoutFeedback: FCReactive<TouchableWithoutFeedback, TouchableWithoutFeedbackProps>;
        View: FCReactive<View, ViewProps>;
    }
}

export { enableReactNativeComponents };
