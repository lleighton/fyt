var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
    for (var name in all) __defProp(target, name, {
      get: all[name],
      enumerable: !0
    });
  },
  __copyProps = (to, from, except, desc) => {
    if (from && typeof from == "object" || typeof from == "function") for (let key of __getOwnPropNames(from)) !__hasOwnProp.call(to, key) && key !== except && __defProp(to, key, {
      get: () => from[key],
      enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
    });
    return to;
  };
var __toCommonJS = mod => __copyProps(__defProp({}, "__esModule", {
  value: !0
}), mod);
var PooledClass_exports = {};
__export(PooledClass_exports, {
  PooledClass: () => PooledClass,
  default: () => PooledClass_default
});
module.exports = __toCommonJS(PooledClass_exports);
var twoArgumentPooler = function (a1, a2) {
    var Klass = this;
    if (Klass.instancePool.length) {
      var instance = Klass.instancePool.pop();
      return Klass.call(instance, a1, a2), instance;
    } else return new Klass(a1, a2);
  },
  standardReleaser = function (instance) {
    var Klass = this;
    instance.destructor(), Klass.instancePool.length < Klass.poolSize && Klass.instancePool.push(instance);
  },
  DEFAULT_POOL_SIZE = 10,
  DEFAULT_POOLER = twoArgumentPooler,
  addPoolingTo = function (CopyConstructor, pooler) {
    var NewKlass = CopyConstructor;
    return NewKlass.instancePool = [], NewKlass.getPooled = pooler || DEFAULT_POOLER, NewKlass.poolSize || (NewKlass.poolSize = DEFAULT_POOL_SIZE), NewKlass.release = standardReleaser, NewKlass;
  },
  PooledClass = {
    addPoolingTo,
    twoArgumentPooler
  };
var PooledClass_default = PooledClass;