function clamp(min, value, max) {
  return value < min ? min : value > max ? max : value;
}
var clamp_default = clamp;
export { clamp, clamp_default as default };
//# sourceMappingURL=clamp.mjs.map
