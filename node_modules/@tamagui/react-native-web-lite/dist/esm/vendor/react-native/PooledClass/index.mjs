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
export { PooledClass, PooledClass_default as default };
//# sourceMappingURL=index.mjs.map
