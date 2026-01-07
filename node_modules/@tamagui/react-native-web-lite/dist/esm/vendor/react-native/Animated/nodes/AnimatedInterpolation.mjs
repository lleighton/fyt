import { AnimatedWithChildren } from "./AnimatedWithChildren.mjs";
import { NativeAnimatedHelper } from "../NativeAnimatedHelper.mjs";
import { normalizeColor, invariant } from "@tamagui/react-native-web-internals";
const __DEV__ = process.env.NODE_ENV !== "production",
  linear = t => t;
function createInterpolation(config) {
  if (config.outputRange && typeof config.outputRange[0] == "string") return createInterpolationFromStringOutputRange(config);
  const outputRange = config.outputRange,
    inputRange = config.inputRange;
  __DEV__ && (checkInfiniteRange("outputRange", outputRange), checkInfiniteRange("inputRange", inputRange), checkValidInputRange(inputRange), invariant(inputRange.length === outputRange.length, "inputRange (" + inputRange.length + ") and outputRange (" + outputRange.length + ") must have the same length"));
  const easing = config.easing || linear;
  let extrapolateLeft = "extend";
  config.extrapolateLeft !== void 0 ? extrapolateLeft = config.extrapolateLeft : config.extrapolate !== void 0 && (extrapolateLeft = config.extrapolate);
  let extrapolateRight = "extend";
  return config.extrapolateRight !== void 0 ? extrapolateRight = config.extrapolateRight : config.extrapolate !== void 0 && (extrapolateRight = config.extrapolate), input => {
    invariant(typeof input == "number", "Cannot interpolation an input which is not a number");
    const range = findRange(input, inputRange);
    return interpolate(input, inputRange[range], inputRange[range + 1], outputRange[range], outputRange[range + 1], easing, extrapolateLeft, extrapolateRight);
  };
}
function interpolate(input, inputMin, inputMax, outputMin, outputMax, easing, extrapolateLeft, extrapolateRight) {
  let result = input;
  if (result < inputMin) {
    if (extrapolateLeft === "identity") return result;
    extrapolateLeft === "clamp" && (result = inputMin);
  }
  if (result > inputMax) {
    if (extrapolateRight === "identity") return result;
    extrapolateRight === "clamp" && (result = inputMax);
  }
  return outputMin === outputMax ? outputMin : inputMin === inputMax ? input <= inputMin ? outputMin : outputMax : (inputMin === -1 / 0 ? result = -result : inputMax === 1 / 0 ? result = result - inputMin : result = (result - inputMin) / (inputMax - inputMin), result = easing(result), outputMin === -1 / 0 ? result = -result : outputMax === 1 / 0 ? result = result + outputMin : result = result * (outputMax - outputMin) + outputMin, result);
}
function colorToRgba(input) {
  let normalizedColor = normalizeColor(input);
  if (normalizedColor === null || typeof normalizedColor != "number") return input;
  normalizedColor = normalizedColor || 0;
  const r = (normalizedColor & 4278190080) >>> 24,
    g = (normalizedColor & 16711680) >>> 16,
    b = (normalizedColor & 65280) >>> 8,
    a = (normalizedColor & 255) / 255;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
const stringShapeRegex = /[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/g;
function createInterpolationFromStringOutputRange(config) {
  let outputRange = config.outputRange;
  invariant(outputRange.length >= 2, "Bad output range"), outputRange = outputRange.map(colorToRgba), checkPattern(outputRange);
  const outputRanges = outputRange[0].match(stringShapeRegex).map(() => []);
  outputRange.forEach(value => {
    value.match(stringShapeRegex).forEach((number, i) => {
      outputRanges[i].push(+number);
    });
  });
  const interpolations = outputRange[0].match(stringShapeRegex).map((value, i) => createInterpolation({
      ...config,
      outputRange: outputRanges[i]
    })),
    shouldRound = isRgbOrRgba(outputRange[0]);
  return input => {
    let i = 0;
    return outputRange[0].replace(stringShapeRegex, () => {
      let val = +interpolations[i++](input);
      return shouldRound && (val = i < 4 ? Math.round(val) : Math.round(val * 1e3) / 1e3), String(val);
    });
  };
}
function isRgbOrRgba(range) {
  return typeof range == "string" && range.startsWith("rgb");
}
function checkPattern(arr) {
  const pattern = arr[0].replace(stringShapeRegex, "");
  for (let i = 1; i < arr.length; ++i) invariant(pattern === arr[i].replace(stringShapeRegex, ""), "invalid pattern " + arr[0] + " and " + arr[i]);
}
function findRange(input, inputRange) {
  let i;
  for (i = 1; i < inputRange.length - 1 && !(inputRange[i] >= input); ++i);
  return i - 1;
}
function checkValidInputRange(arr) {
  invariant(arr.length >= 2, "inputRange must have at least 2 elements");
  const message = "inputRange must be monotonically non-decreasing " + String(arr);
  for (let i = 1; i < arr.length; ++i) invariant(arr[i] >= arr[i - 1], message);
}
function checkInfiniteRange(name, arr) {
  invariant(arr.length >= 2, name + " must have at least 2 elements"), invariant(arr.length !== 2 || arr[0] !== -1 / 0 || arr[1] !== 1 / 0, name + "cannot be ]-infinity;+infinity[ " + arr);
}
class AnimatedInterpolation extends AnimatedWithChildren {
  // Export for testing.
  static __createInterpolation = createInterpolation;
  constructor(parent, config) {
    super(), this._parent = parent, this._config = config, this._interpolation = createInterpolation(config);
  }
  __makeNative(platformConfig) {
    this._parent.__makeNative(platformConfig), super.__makeNative(platformConfig);
  }
  __getValue() {
    const parentValue = this._parent.__getValue();
    return invariant(typeof parentValue == "number", "Cannot interpolate an input which is not a number."), this._interpolation(parentValue);
  }
  interpolate(config) {
    return new AnimatedInterpolation(this, config);
  }
  __attach() {
    this._parent.__addChild(this);
  }
  __detach() {
    this._parent.__removeChild(this), super.__detach();
  }
  __transformDataType(range) {
    return range.map(NativeAnimatedHelper.transformDataType);
  }
  __getNativeConfig() {
    return __DEV__ && NativeAnimatedHelper.validateInterpolation(this._config), {
      inputRange: this._config.inputRange,
      // Only the `outputRange` can contain strings so we don't need to transform `inputRange` here
      outputRange: this.__transformDataType(this._config.outputRange),
      extrapolateLeft: this._config.extrapolateLeft || this._config.extrapolate || "extend",
      extrapolateRight: this._config.extrapolateRight || this._config.extrapolate || "extend",
      type: "interpolation"
    };
  }
}
var AnimatedInterpolation_default = AnimatedInterpolation;
export { AnimatedInterpolation, AnimatedInterpolation_default as default };
//# sourceMappingURL=AnimatedInterpolation.mjs.map
