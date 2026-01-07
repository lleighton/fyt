import { isArray, applyChanges, internal } from '@legendapp/state';

// src/persist-plugins/async-storage.ts
var MetadataSuffix = "__m";
var AsyncStorage;
var { safeParse, safeStringify } = internal;
var ObservablePersistAsyncStorage = class {
  constructor(configuration) {
    this.data = {};
    this.configuration = configuration;
  }
  async initialize(configOptions) {
    const storageConfig = this.configuration || configOptions.asyncStorage;
    let tables = [];
    if (storageConfig) {
      AsyncStorage = storageConfig.AsyncStorage;
      const { preload } = storageConfig;
      try {
        if (preload === true) {
          tables = await AsyncStorage.getAllKeys();
        } else if (isArray(preload)) {
          const metadataTables = preload.map(
            (table) => table.endsWith(MetadataSuffix) ? void 0 : table + MetadataSuffix
          );
          tables = [...preload, ...metadataTables.filter(Boolean)];
        }
        if (tables) {
          const values = await AsyncStorage.multiGet(tables);
          values.forEach(([table, value]) => {
            this.data[table] = value ? safeParse(value) : void 0;
          });
        }
      } catch (e) {
        console.error("[legend-state] ObservablePersistAsyncStorage failed to initialize", e);
      }
    } else {
      console.error("[legend-state] Missing asyncStorage configuration");
    }
  }
  loadTable(table) {
    if (this.data[table] === void 0) {
      return AsyncStorage.multiGet([table, table + MetadataSuffix]).then((values) => {
        try {
          values.forEach(([table2, value]) => {
            this.data[table2] = value ? safeParse(value) : void 0;
          });
        } catch (err) {
          console.error("[legend-state] ObservablePersistLocalAsyncStorage failed to parse", table, err);
        }
      }).catch((err) => {
        if ((err == null ? void 0 : err.message) !== "window is not defined") {
          console.error("[legend-state] AsyncStorage.multiGet failed", table, err);
        }
      });
    }
  }
  // Gets
  getTable(table, init) {
    var _a, _b;
    return (_b = (_a = this.data[table]) != null ? _a : init) != null ? _b : {};
  }
  getMetadata(table) {
    return this.getTable(table + MetadataSuffix, {});
  }
  // Sets
  set(table, changes) {
    if (!this.data[table]) {
      this.data[table] = {};
    }
    this.data[table] = applyChanges(this.data[table], changes);
    return this.save(table);
  }
  setMetadata(table, metadata) {
    return this.setValue(table + MetadataSuffix, metadata);
  }
  async deleteTable(table) {
    return AsyncStorage.removeItem(table);
  }
  deleteMetadata(table) {
    return this.deleteTable(table + MetadataSuffix);
  }
  // Private
  async setValue(table, value) {
    this.data[table] = value;
    await this.save(table);
  }
  async save(table) {
    const v = this.data[table];
    if (v !== void 0 && v !== null) {
      return AsyncStorage.setItem(table, safeStringify(v));
    } else {
      return AsyncStorage.removeItem(table);
    }
  }
};
function observablePersistAsyncStorage(configuration) {
  return new ObservablePersistAsyncStorage(configuration);
}

export { ObservablePersistAsyncStorage, observablePersistAsyncStorage };
