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
var InteractionManager_exports = {};
__export(InteractionManager_exports, {
  InteractionManager: () => InteractionManager
});
module.exports = __toCommonJS(InteractionManager_exports);
var import_invariant = require("./invariant.cjs"),
  import_requestIdleCallback = require("./requestIdleCallback/index.cjs");
class EventEmitter {
  _registry = {};
  addListener(eventType, listener, context) {
    const registrations = this._allocate(eventType),
      registration = {
        context,
        listener,
        remove: () => {
          registrations.delete(registration);
        }
      };
    return registrations.add(registration), registration;
  }
  emit(eventType, ...args) {
    const registrations = this._registry[eventType];
    if (registrations != null) for (const registration of Array.from(registrations)) registration.listener.apply(registration.context, args);
  }
  _allocate(eventType) {
    let registrations = this._registry[eventType];
    return registrations == null && (registrations = /* @__PURE__ */new Set(), this._registry[eventType] = registrations), registrations;
  }
}
class TaskQueue {
  _queueStack;
  _onMoreTasks;
  constructor({
    onMoreTasks
  }) {
    this._onMoreTasks = onMoreTasks, this._queueStack = [{
      tasks: [],
      popable: !0
    }];
  }
  enqueueTasks(tasks) {
    tasks.forEach(task => this._enqueue(task));
  }
  cancelTasks(tasksToCancel) {
    this._queueStack = this._queueStack.map(queue => ({
      ...queue,
      tasks: queue.tasks.filter(task => !tasksToCancel.includes(task))
    })).filter((queue, idx) => queue.tasks.length > 0 || idx === 0);
  }
  hasTasksToProcess() {
    return this._getCurrentQueue().length > 0;
  }
  processNext() {
    const queue = this._getCurrentQueue();
    if (queue.length) {
      const task = queue.shift();
      try {
        typeof task == "object" && task && "gen" in task ? this._genPromise(task) : typeof task == "object" && task && "run" in task ? task.run() : ((0, import_invariant.invariant)(typeof task == "function", `Expected Function, SimpleTask, or PromiseTask, but got:
` + JSON.stringify(task, null, 2)), task());
      } catch (e) {
        if (e instanceof Error) {
          const taskName = task && typeof task == "object" && "name" in task ? task.name : "";
          e.message = "TaskQueue: Error with task " + taskName + ": " + e.message;
        }
        throw e;
      }
    }
  }
  _enqueue(task) {
    this._getCurrentQueue().push(task);
  }
  _getCurrentQueue() {
    const stackIdx = this._queueStack.length - 1,
      queue = this._queueStack[stackIdx];
    return queue.popable && queue.tasks.length === 0 && stackIdx > 0 ? (this._queueStack.pop(), this._getCurrentQueue()) : queue.tasks;
  }
  _genPromise(task) {
    const stackIdx = this._queueStack.push({
        tasks: [],
        popable: !1
      }) - 1,
      stackItem = this._queueStack[stackIdx];
    task.gen().then(() => {
      stackItem.popable = !0, this.hasTasksToProcess() && this._onMoreTasks();
    }).catch(ex => {
      setTimeout(() => {
        throw ex instanceof Error && (ex.message = `TaskQueue: Error resolving Promise in task ${task.name}: ${ex.message}`), ex;
      }, 0);
    });
  }
}
const _emitter = new EventEmitter(),
  InteractionManager = {
    Events: {
      interactionStart: "interactionStart",
      interactionComplete: "interactionComplete"
    },
    /**
     * Schedule a function to run after all interactions have completed.
     */
    runAfterInteractions(task) {
      const tasks = [],
        promise = new Promise(resolve => {
          _scheduleUpdate(), task && tasks.push(task), tasks.push({
            run: resolve,
            name: "resolve " + (task && typeof task == "object" && "name" in task && task.name || "?")
          }), _taskQueue.enqueueTasks(tasks);
        });
      return {
        then: promise.then.bind(promise),
        done: promise.then.bind(promise),
        cancel: () => {
          _taskQueue.cancelTasks(tasks);
        }
      };
    },
    /**
     * Notify manager that an interaction has started.
     */
    createInteractionHandle() {
      _scheduleUpdate();
      const handle = ++_inc;
      return _addInteractionSet.add(handle), handle;
    },
    /**
     * Notify manager that an interaction has completed.
     */
    clearInteractionHandle(handle) {
      (0, import_invariant.invariant)(!!handle, "Must provide a handle to clear."), _scheduleUpdate(), _addInteractionSet.delete(handle), _deleteInteractionSet.add(handle);
    },
    addListener: _emitter.addListener.bind(_emitter),
    /**
     * Set deadline for task processing
     */
    setDeadline(deadline) {
      _deadline = deadline;
    }
  },
  _interactionSet = /* @__PURE__ */new Set(),
  _addInteractionSet = /* @__PURE__ */new Set(),
  _deleteInteractionSet = /* @__PURE__ */new Set(),
  _taskQueue = new TaskQueue({
    onMoreTasks: _scheduleUpdate
  });
let _nextUpdateHandle = null,
  _inc = 0,
  _deadline = -1;
function _scheduleUpdate() {
  _nextUpdateHandle || (_deadline > 0 ? _nextUpdateHandle = setTimeout(_processUpdate) : _nextUpdateHandle = (0, import_requestIdleCallback.requestIdleCallback)(_processUpdate));
}
function _processUpdate() {
  _nextUpdateHandle = null;
  const interactionCount = _interactionSet.size;
  _addInteractionSet.forEach(handle => _interactionSet.add(handle)), _deleteInteractionSet.forEach(handle => _interactionSet.delete(handle));
  const nextInteractionCount = _interactionSet.size;
  if (interactionCount !== 0 && nextInteractionCount === 0 ? _emitter.emit("interactionComplete") : interactionCount === 0 && nextInteractionCount !== 0 && _emitter.emit("interactionStart"), nextInteractionCount === 0) {
    const begin = Date.now();
    for (; _taskQueue.hasTasksToProcess();) if (_taskQueue.processNext(), _deadline > 0 && Date.now() - begin >= _deadline) {
      _scheduleUpdate();
      break;
    }
  }
  _addInteractionSet.clear(), _deleteInteractionSet.clear();
}