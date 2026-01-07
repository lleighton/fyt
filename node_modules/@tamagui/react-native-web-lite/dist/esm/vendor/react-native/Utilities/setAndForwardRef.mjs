function setAndForwardRef({
  getForwardedRef,
  setLocalRef
}) {
  return function (ref) {
    const forwardedRef = getForwardedRef();
    setLocalRef(ref), typeof forwardedRef == "function" ? forwardedRef(ref) : typeof forwardedRef == "object" && forwardedRef != null && (forwardedRef.current = ref);
  };
}
var setAndForwardRef_default = setAndForwardRef;
export { setAndForwardRef_default as default, setAndForwardRef };
//# sourceMappingURL=setAndForwardRef.mjs.map
