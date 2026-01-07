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
var EventEmitter_exports = {};
__export(EventEmitter_exports, {
  EventEmitter: () => EventEmitter,
  EventSubscription: () => EventSubscription,
  IEventEmitter: () => IEventEmitter,
  default: () => EventEmitter_default
});
module.exports = __toCommonJS(EventEmitter_exports);
class EventSubscription {
  remove() {}
}
class IEventEmitter {
  addListener(eventType, listener, context) {
    return new EventSubscription();
  }
  emit(eventType, ...args) {}
  removeAllListeners(eventType) {}
  listenerCount(eventType) {
    return 0;
  }
}
class EventEmitter {
  _registry = {};
  /**
   * Registers a listener that is called when the supplied event is emitted.
   * Returns a subscription that has a `remove` method to undo registration.
   */
  addListener(eventType, listener, context) {
    const registrations = allocate(this._registry, eventType),
      registration = {
        context,
        listener,
        remove() {
          registrations.delete(registration);
        }
      };
    return registrations.add(registration), registration;
  }
  /**
   * Emits the supplied event. Additional arguments supplied to `emit` will be
   * passed through to each of the registered listeners.
   *
   * If a listener modifies the listeners registered for the same event, those
   * changes will not be reflected in the current invocation of `emit`.
   */
  emit(eventType, ...args) {
    const registrations = this._registry[eventType];
    if (registrations != null) for (const registration of [...registrations]) registration.listener.apply(registration.context, args);
  }
  /**
   * Removes all registered listeners.
   */
  removeAllListeners(eventType) {
    eventType == null ? this._registry = {} : delete this._registry[eventType];
  }
  /**
   * Returns the number of registered listeners for the supplied event.
   */
  listenerCount(eventType) {
    const registrations = this._registry[eventType];
    return registrations == null ? 0 : registrations.size;
  }
}
function allocate(registry, eventType) {
  let registrations = registry[eventType];
  return registrations == null && (registrations = /* @__PURE__ */new Set(), registry[eventType] = registrations), registrations;
}
var EventEmitter_default = EventEmitter;