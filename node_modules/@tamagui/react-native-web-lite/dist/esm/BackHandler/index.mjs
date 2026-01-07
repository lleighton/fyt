function emptyFunction() {}
const BackHandler = {
  exitApp: emptyFunction,
  addEventListener() {
    return {
      remove: emptyFunction
    };
  },
  removeEventListener: emptyFunction
};
export { BackHandler };
//# sourceMappingURL=index.mjs.map
