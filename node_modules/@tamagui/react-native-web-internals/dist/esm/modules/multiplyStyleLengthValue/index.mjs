const CSS_UNIT_RE = /^[+-]?\d*(?:\.\d+)?(?:[Ee][+-]?\d+)?(%|\w*)/,
  getUnit = str => str.match(CSS_UNIT_RE)[1],
  isNumeric = n => !isNaN(parseFloat(n)) && isFinite(n),
  multiplyStyleLengthValue = (value, multiple) => {
    if (typeof value == "string") {
      const number = parseFloat(value) * multiple,
        unit = getUnit(value);
      return `${number}${unit}`;
    } else if (isNumeric(value)) return value * multiple;
  };
export { multiplyStyleLengthValue };
//# sourceMappingURL=index.mjs.map
