'use strict';

var state = require('@legendapp/state');

// src/helpers/time.ts
var MSPerMinute = 6e4;
function clearTime(date) {
  date = new Date(date);
  date.setHours(0, 0, 0, 0);
  return date;
}
var time = /* @__PURE__ */ new Date();
var currentTime = state.observable(time);
var currentDay = state.observable(clearTime(time));
var timeToSecond = (60 - time.getSeconds() + 1) * 1e3;
function update() {
  const now = /* @__PURE__ */ new Date();
  currentTime.set(now);
  if (now.getDate() !== time.getDate()) {
    currentDay.set(clearTime(now));
  }
  time = now;
}
setTimeout(() => {
  update();
  setInterval(update, MSPerMinute);
}, timeToSecond);

exports.currentDay = currentDay;
exports.currentTime = currentTime;
