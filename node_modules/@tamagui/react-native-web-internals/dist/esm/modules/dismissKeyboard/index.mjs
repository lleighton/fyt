import { TextInputState } from "../TextInputState/index.mjs";
const dismissKeyboard = () => {
  TextInputState.blurTextInput(TextInputState.currentlyFocusedField());
};
export { dismissKeyboard };
//# sourceMappingURL=index.mjs.map
