import { computeSelector, isString, getNodeValue } from '@legendapp/state';
import { synced } from '@legendapp/state/sync';

// src/sync-plugins/fetch.ts
function syncedFetch(props) {
  const {
    get: getParam,
    set: setParam,
    getInit,
    setInit,
    valueType,
    onSaved,
    onSavedValueType,
    transform,
    ...rest
  } = props;
  const get = async () => {
    const url = computeSelector(getParam);
    if (url && isString(url)) {
      const response = await fetch(url, getInit);
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      let value = await response[valueType || "json"]();
      if (transform == null ? void 0 : transform.load) {
        value = transform == null ? void 0 : transform.load(value, "get");
      }
      return value;
    } else {
      return null;
    }
  };
  let set = void 0;
  if (setParam) {
    set = async ({ value, node, update }) => {
      const url = computeSelector(setParam);
      const response = await fetch(
        url,
        Object.assign({ method: "POST" }, setInit, { body: JSON.stringify(value) })
      );
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      if (onSaved) {
        const responseValue = await response[onSavedValueType || valueType || "json"]();
        const transformed = (transform == null ? void 0 : transform.load) ? await transform.load(responseValue, "set") : responseValue;
        const currentValue = getNodeValue(node);
        const valueSave = onSaved({ input: value, saved: transformed, currentValue, props });
        update({
          value: valueSave
        });
      }
    };
  }
  return synced({
    ...rest,
    get,
    set
  });
}

export { syncedFetch };
