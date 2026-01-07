const float32ArraySupported = typeof Float32Array == "function";
function A(aA1, aA2) {
  return 1 - 3 * aA2 + 3 * aA1;
}
function B(aA1, aA2) {
  return 3 * aA2 - 6 * aA1;
}
function C(aA1) {
  return 3 * aA1;
}
function calcBezier(aT, aA1, aA2) {
  return ((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT;
}
function getSlope(aT, aA1, aA2) {
  return 3 * A(aA1, aA2) * aT * aT + 2 * B(aA1, aA2) * aT + C(aA1);
}
function binarySubdivide(aX, _aA, _aB, mX1, mX2) {
  let currentX,
    currentT,
    i = 0,
    aA = _aA,
    aB = _aB;
  do currentT = aA + (aB - aA) / 2, currentX = calcBezier(currentT, mX1, mX2) - aX, currentX > 0 ? aB = currentT : aA = currentT; while (Math.abs(currentX) > 1e-7 && ++i < 10);
  return currentT;
}
function newtonRaphsonIterate(aX, _aGuessT, mX1, mX2) {
  let aGuessT = _aGuessT;
  for (let i = 0; i < 4; ++i) {
    const currentSlope = getSlope(aGuessT, mX1, mX2);
    if (currentSlope === 0) return aGuessT;
    const currentX = calcBezier(aGuessT, mX1, mX2) - aX;
    aGuessT -= currentX / currentSlope;
  }
  return aGuessT;
}
function bezier(mX1, mY1, mX2, mY2) {
  if (!(mX1 >= 0 && mX1 <= 1 && mX2 >= 0 && mX2 <= 1)) throw new Error("bezier x values must be in [0, 1] range");
  const sampleValues = float32ArraySupported ? new Float32Array(11) : new Array(11);
  if (mX1 !== mY1 || mX2 !== mY2) for (let i = 0; i < 11; ++i) sampleValues[i] = calcBezier(i * 0.1, mX1, mX2);
  function getTForX(aX) {
    let intervalStart = 0,
      currentSample = 1;
    const lastSample = 10;
    for (; currentSample !== lastSample && sampleValues[currentSample] <= aX; ++currentSample) intervalStart += 0.1;
    --currentSample;
    const dist = (aX - sampleValues[currentSample]) / (sampleValues[currentSample + 1] - sampleValues[currentSample]),
      guessForT = intervalStart + dist * 0.1,
      initialSlope = getSlope(guessForT, mX1, mX2);
    return initialSlope >= 1e-3 ? newtonRaphsonIterate(aX, guessForT, mX1, mX2) : initialSlope === 0 ? guessForT : binarySubdivide(aX, intervalStart, intervalStart + 0.1, mX1, mX2);
  }
  return function (x) {
    return mX1 === mY1 && mX2 === mY2 ? x : x === 0 ? 0 : x === 1 ? 1 : calcBezier(getTForX(x), mY1, mY2);
  };
}
var bezier_default = bezier;
export { bezier, bezier_default as default };
//# sourceMappingURL=bezier.mjs.map
