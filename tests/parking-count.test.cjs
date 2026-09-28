const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const CACHE_KEY = "parking-space:last-known:v1";

function createHarness(storage = new Map(), storageUnavailable = false) {
  let now = new Date(2026, 8, 28, 15).getTime();
  let timerId = 0;
  let definition;
  const timers = new Map();
  const requests = [];
  const updates = [];
  class Clock extends Date {
    constructor(...args) { super(...(args.length ? args : [now])); }
    static now() { return now; }
  }
  const source = fs.readFileSync(path.join(__dirname,
    "../miniprogram/components/commuteV2/commuteV2.js"), "utf8")
    .replace(/^import\s+[\s\S]*?from\s+["'][^"']+["'];\s*/gm, "");
  vm.runInNewContext(source, {
    Component: (value) => { definition = value; },
    Date: Clock,
    console: { error() {} },
    wx: {
      getStorageSync(key) {
        if (storageUnavailable) throw new Error("Storage unavailable");
        return storage.get(key);
      },
      setStorageSync(key, value) {
        if (storageUnavailable) throw new Error("Storage unavailable");
        storage.set(key, { ...value });
      },
    },
    fetchParkingSpace: () => new Promise((resolve, reject) => requests.push({ resolve, reject })),
    fetchLastWeekParkingFullTime: async () => null,
    getWeekdayIndexStr: () => "一",
    recordParkingFull() {},
    setTimeout: (callback, delay) => {
      timers.set(++timerId, { callback, at: now + delay });
      return timerId;
    },
    clearTimeout: (id) => timers.delete(id),
  });
  const component = {
    ...definition.methods,
    data: JSON.parse(JSON.stringify(definition.data)),
    setData(changes) {
      updates.push(changes);
      for (const [key, value] of Object.entries(changes)) {
        const parts = key.split(".");
        let target = this.data;
        for (const part of parts.slice(0, -1)) target = target[part];
        target[parts.at(-1)] = value;
      }
    },
  };
  definition.lifetimes.attached.call(component);
  return {
    component, requests, timers, updates, storage,
    advance(ms) {
      const end = now + ms;
      while (timers.size) {
        const [id, next] = [...timers.entries()].sort((a, b) => a[1].at - b[1].at)[0];
        if (next.at > end) break;
        now = next.at;
        timers.delete(id);
        next.callback();
      }
      now = end;
    },
    detach() { definition.lifetimes.detached.call(component); },
  };
}

const flush = () => new Promise(setImmediate);

test("first successful response makes actual counts available to the reels", async () => {
  const h = createHarness();
  assert.equal(h.component.data.hasParkingData, false);
  h.requests[0].resolve({ b25: 320, zhongmeng: 84 });
  await flush();
  assert.equal(h.component.data.hasParkingData, true);
  assert.equal(h.component.data.parkingSpace.b25.remaining, 320);
  assert.equal(h.component.data.parkingSpace.zhongmeng.remaining, 84);
  assert.deepEqual(h.storage.get(CACHE_KEY), { b25: 320, zhongmeng: 84 });
});

test("out-of-order requests cannot replace newer counts", async () => {
  const h = createHarness();
  h.component.refresh();
  h.requests[1].resolve({ b25: 20, zhongmeng: 0 });
  await flush();
  h.requests[0].resolve({ b25: 400, zhongmeng: 150 });
  await flush();
  assert.equal(h.component.data.parkingSpace.b25.remaining, 20);
  assert.equal(h.component.data.parkingSpace.zhongmeng.remaining, 0);
});

test("detaching ignores pending parking responses", async () => {
  const h = createHarness();
  await flush();
  h.detach();
  const count = h.updates.length;
  h.requests[0].resolve({ b25: 20, zhongmeng: 10 });
  await flush();
  assert.equal(h.updates.length, count);
});

test("invalid or failed responses preserve last known values and allow retry", async () => {
  const h = createHarness();
  h.requests[0].reject(new Error("Network error"));
  await flush();
  assert.equal(h.component.data.hasParkingData, false);
  assert.equal(h.component.data.loadingParkingSpace, false);
  h.component.refresh();
  h.requests[1].resolve({ b25: "150", zhongmeng: "50" });
  await flush();
  h.component.refresh();
  h.requests[2].resolve({ b25: null, zhongmeng: 20 });
  await flush();
  assert.equal(h.component.data.parkingSpace.b25.remaining, 150);
  assert.equal(h.component.data.parkingSpace.zhongmeng.remaining, 50);
  assert.equal(h.component.data.loadingParkingSpace, false);
  assert.deepEqual(h.storage.get(CACHE_KEY), { b25: 150, zhongmeng: 50 });
});

test("reopening the home page starts at the last successful count before fetching", async () => {
  const storage = new Map();
  const first = createHarness(storage);
  first.requests[0].resolve({ b25: 128, zhongmeng: 0 });
  await flush();
  first.detach();
  const reopened = createHarness(storage);
  assert.equal(reopened.component.data.parkingInitialized, true);
  assert.equal(reopened.component.data.loadingParkingSpace, true);
  assert.equal(reopened.component.data.parkingSpace.b25.remaining, 128);
  assert.equal(reopened.component.data.parkingSpace.zhongmeng.remaining, 0);
  assert.equal(reopened.component.data.parkingSpace.zhongmeng.usedPercent, 100);
  // Reels mount only after their cached starting values have been restored.
  const mountIndex = reopened.updates.findIndex((update) => update.parkingInitialized);
  const restoreIndex = reopened.updates.findIndex((update) => update.hasParkingData);
  assert.ok(restoreIndex >= 0 && restoreIndex < mountIndex);
  reopened.requests[0].resolve({ b25: 127, zhongmeng: 2 });
  await flush();
  assert.deepEqual(storage.get(CACHE_KEY), { b25: 127, zhongmeng: 2 });
});

test("a failed refresh keeps cached counts instead of reverting to capacity", async () => {
  const storage = new Map([[CACHE_KEY, { b25: 128, zhongmeng: 46 }]]);
  const h = createHarness(storage);
  h.requests[0].reject(new Error("Offline"));
  await flush();
  assert.equal(h.component.data.parkingSpace.b25.remaining, 128);
  assert.equal(h.component.data.parkingSpace.zhongmeng.remaining, 46);
  assert.deepEqual(storage.get(CACHE_KEY), { b25: 128, zhongmeng: 46 });
});

test("invalid cache and unavailable storage fall back without blocking live updates", async () => {
  for (const unavailable of [false, true]) {
    const h = createHarness(new Map([[CACHE_KEY, { b25: null, zhongmeng: "bad" }]]), unavailable);
    assert.equal(h.component.data.parkingInitialized, true);
    assert.equal(h.component.data.parkingSpace.b25.remaining, 508);
    assert.equal(h.component.data.parkingSpace.zhongmeng.remaining, 205);
    h.requests[0].resolve({ b25: 100, zhongmeng: 20 });
    await flush();
    assert.equal(h.component.data.parkingSpace.b25.remaining, 100);
    assert.equal(h.component.data.loadingParkingSpace, false);
  }
});
