'use strict';

var state = require('@legendapp/state');
var Router = require('next/router');

function _interopDefault (e) { return e && e.__esModule ? e : { default: e }; }

var Router__default = /*#__PURE__*/_interopDefault(Router);

// src/react-hooks/useObservableNextRouter.ts
function isShallowEqual(query1, query2) {
  if (!query1 !== !query2) {
    return false;
  }
  const keys1 = Object.keys(query1);
  const keys2 = Object.keys(query2);
  if (keys1.length !== keys2.length) {
    return false;
  }
  for (const key of keys1) {
    if (query1[key] !== query2[key]) {
      return false;
    }
  }
  return true;
}
var routes$ = state.observable({});
var routeParams = {};
var router;
routes$.onChange(({ value, getPrevious }) => {
  let setter = routeParams == null ? void 0 : routeParams.set;
  if (!setter) {
    if (value.pathname) {
      setter = () => value;
    } else {
      console.error("[legend-state]: Must provide a set method to useObservableNextRouter");
    }
  }
  const setReturn = setter(value, getPrevious(), router);
  const { pathname, hash, query } = setReturn;
  let { transitionOptions, method } = setReturn;
  method = method || (routeParams == null ? void 0 : routeParams.method);
  transitionOptions = transitionOptions || (routeParams == null ? void 0 : routeParams.transitionOptions);
  const prevHash = router.asPath.split("#")[1] || "";
  const change = {};
  if (pathname !== void 0 && pathname !== router.pathname) {
    change.pathname = pathname;
  }
  if (hash !== void 0 && hash !== prevHash) {
    change.hash = hash;
  }
  if (query !== void 0 && !isShallowEqual(query, router.query)) {
    change.query = query;
  }
  if (!state.isEmpty(change)) {
    const fn = method === "replace" ? "replace" : "push";
    router[fn](change, void 0, transitionOptions).catch((e) => {
      if (!e.cancelled)
        throw e;
    });
  }
});
function useObservableNextRouter(params) {
  const { subscribe, compute } = params || {};
  try {
    router = typeof window !== "undefined" && !subscribe ? Router__default.default : Router.useRouter();
  } finally {
    router = router || Router.useRouter();
  }
  routeParams = params;
  const { asPath, pathname, query } = router;
  const hash = asPath.split("#")[1] || "";
  const computeParams = { pathname, hash, query };
  const obj = compute ? compute(computeParams) : computeParams;
  state.setSilently(routes$, obj);
  return routes$;
}

exports.useObservableNextRouter = useObservableNextRouter;
