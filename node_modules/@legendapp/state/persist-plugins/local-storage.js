'use strict';

var state = require('@legendapp/state');

// src/persist-plugins/local-storage.ts
var { safeParse, safeStringify } = state.internal;
var MetadataSuffix = "__m";
var ObservablePersistLocalStorageBase = class {
  constructor(storage) {
    this.data = {};
    this.storage = storage;
  }
  getTable(table, init) {
    if (!this.storage)
      return void 0;
    if (this.data[table] === void 0) {
      try {
        const value = this.storage.getItem(table);
        this.data[table] = value ? safeParse(value) : init;
      } catch (e) {
        console.error("[legend-state] ObservablePersistLocalStorageBase failed to parse", table);
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
    this.data[table] = state.applyChanges(this.data[table], changes);
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
    this.storage.removeItem(table);
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
      this.storage.setItem(table, safeStringify(v));
    } else {
      this.storage.removeItem(table);
    }
  }
};
var ObservablePersistLocalStorage = class extends ObservablePersistLocalStorageBase {
  constructor() {
    super(
      typeof localStorage !== "undefined" ? localStorage : process.env.NODE_ENV === "test" ? (
        // @ts-expect-error This is ok to do in jest
        globalThis._testlocalStorage
      ) : void 0
    );
  }
};
var ObservablePersistSessionStorage = class extends ObservablePersistLocalStorageBase {
  constructor() {
    super(
      typeof sessionStorage !== "undefined" ? sessionStorage : process.env.NODE_ENV === "test" ? (
        // @ts-expect-error This is ok to do in jest
        globalThis._testlocalStorage
      ) : void 0
    );
  }
};

exports.ObservablePersistLocalStorage = ObservablePersistLocalStorage;
exports.ObservablePersistLocalStorageBase = ObservablePersistLocalStorageBase;
exports.ObservablePersistSessionStorage = ObservablePersistSessionStorage;
