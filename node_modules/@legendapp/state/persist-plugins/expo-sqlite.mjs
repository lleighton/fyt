import { applyChanges, internal } from '@legendapp/state';

// src/persist-plugins/expo-sqlite.ts
var { safeParse, safeStringify } = internal;
var MetadataSuffix = "__m";
var ObservablePersistSqlite = class {
  constructor(storage) {
    this.data = {};
    if (!storage) {
      console.error(
        "[legend-state] ObservablePersistSqlite failed to initialize. You need to pass the SQLiteStorage instance."
      );
    }
    this.storage = storage;
  }
  getTable(table, init) {
    if (!this.storage)
      return void 0;
    if (this.data[table] === void 0) {
      try {
        const value = this.storage.getItemSync(table);
        this.data[table] = value ? safeParse(value) : init;
      } catch (e) {
        console.error("[legend-state] ObservablePersistSqlite failed to parse", table);
      }
    }
    return this.data[table];
  }
  getMetadata(table) {
    return this.getTable(table + MetadataSuffix, {});
  }
  set(table, changes) {
    if (!this.data[table]) {
      this.data[table] = {};
    }
    this.data[table] = applyChanges(this.data[table], changes);
    this.save(table);
  }
  setMetadata(table, metadata) {
    table = table + MetadataSuffix;
    this.data[table] = metadata;
    this.save(table);
  }
  deleteTable(table) {
    if (!this.storage)
      return void 0;
    delete this.data[table];
    this.storage.removeItemSync(table);
  }
  deleteMetadata(table) {
    this.deleteTable(table + MetadataSuffix);
  }
  // Private
  save(table) {
    if (!this.storage)
      return void 0;
    const v = this.data[table];
    if (v !== void 0 && v !== null) {
      this.storage.setItemSync(table, safeStringify(v));
    } else {
      this.storage.removeItemSync(table);
    }
  }
};
function observablePersistSqlite(storage) {
  return new ObservablePersistSqlite(storage);
}

export { ObservablePersistSqlite, observablePersistSqlite };
