import { observable } from '@legendapp/state';

// src/helpers/time.ts
var MSPerMinute = 6e4;
function clearTime(date) {
  date = new Date(date);
  date.setHours(0, 0, 0, 0);
  return date;
}
var time = /* @__PURE__ */ new Date();
var currentTime = observable(time);
var currentDay = observable(clearTime(time));
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

export { currentDay, currentTime };
