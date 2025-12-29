import { internal } from '@legendapp/state';
import { useRef } from 'react';

// src/trace/useTraceListeners.ts

// src/trace/traceHelpers.ts
function getNodePath(node) {
  const arr = [];
  let n = node;
  while ((n == null ? void 0 : n.key) !== void 0) {
    arr.splice(0, 0, n.key);
    n = n.parent;
  }
  return arr.join(".");
}

// src/trace/useTraceListeners.ts
var { optimized, tracking } = internal;
function useTraceListeners(name) {
  if ((process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") && tracking.current) {
    tracking.current.traceListeners = traceNodes.bind(this, name);
  }
}
function traceNodes(name, nodes) {
  if ((process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") && nodes.size) {
    const arr = [];
    if (nodes) {
      for (const tracked of nodes.values()) {
        const { node, track } = tracked;
        const shallow = track === true;
        const isOptimized = track === optimized;
        arr.push(
          `${arr.length + 1}: ${getNodePath(node)}${shallow ? " (shallow)" : ""}${isOptimized ? " (optimized)" : ""}`
        );
      }
    }
    console.log(
      `[legend-state] ${name ? name + " " : ""}tracking ${arr.length} observable${arr.length !== 1 ? "s" : ""}:
${arr.join("\n")}`
    );
  }
}
var { tracking: tracking2 } = internal;
function useTraceUpdates(name) {
  if ((process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") && tracking2.current) {
    tracking2.current.traceUpdates = replaceUpdateFn.bind(void 0, name);
  }
}
function replaceUpdateFn(name, updateFn) {
  return onChange.bind(void 0, name, updateFn);
}
function onChange(name, updateFn, params) {
  const { changes } = params;
  if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
    changes.forEach(({ path, valueAtPath, prevAtPath }) => {
      console.log(`[legend-state] Rendering ${name ? name + " " : ""}because "${path}" changed:
from: ${JSON.stringify(prevAtPath)}
to: ${JSON.stringify(valueAtPath)}`);
    });
    return updateFn(params);
  }
}
var { optimized: optimized2, tracking: tracking3 } = internal;
function useVerifyNotTracking(name) {
  if (process.env.NODE_ENV === "development") {
    tracking3.current.traceListeners = traceNodes2.bind(this, name);
  }
}
function traceNodes2(name, nodes) {
  if (process.env.NODE_ENV === "development") {
    tracking3.current.traceListeners = void 0;
    const arr = [];
    if (nodes) {
      for (const tracked of nodes.values()) {
        const { node, track } = tracked;
        const shallow = track === true;
        const isOptimized = track === optimized2;
        arr.push(
          `${arr.length + 1}: ${getNodePath(node)}${shallow ? " (shallow)" : ""}${isOptimized ? " (optimized)" : ""}`
        );
      }
      console.error(
        `[legend-state] ${name ? name + " " : ""}tracking ${arr.length} observable${arr.length !== 1 ? "s" : ""} when it should not be:
${arr.join("\n")}`
      );
    }
  }
}
function useVerifyOneRender(name) {
  if (process.env.NODE_ENV === "development") {
    const numRenders = ++useRef(0).current;
    if (numRenders > 1) {
      console.error(`[legend-state] ${name ? name + " " : ""}Component rendered more than once`);
    }
  }
}

export { useTraceListeners, useTraceUpdates, useVerifyNotTracking, useVerifyOneRender };
