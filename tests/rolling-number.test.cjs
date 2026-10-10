const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

function harness(initialValue = -1) {
  let definition, timerId = 0;
  const timers = new Map();
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,
    "../miniprogram/components/rolling-number/index.js"), "utf8"), {
    Component: (value) => { definition = value; },
    setTimeout: (callback) => { timers.set(++timerId, callback); return timerId; },
    clearTimeout: (id) => timers.delete(id),
  });
  const c = {
    ...definition.methods,
    data: { ...JSON.parse(JSON.stringify(definition.data)), value: initialValue },
    setData(changes) { Object.assign(this.data, changes); },
  };
  definition.lifetimes.attached.call(c);
  return {
    c, timers,
    set(value) { c.data.value = value; c.onValueChanged(value); },
    finish() {
      const [id, callback] = timers.entries().next().value;
      timers.delete(id);
      callback();
    },
    hide() { definition.pageLifetimes.hide.call(c); },
    show() { definition.pageLifetimes.show.call(c); },
    detach() { definition.lifetimes.detached.call(c); },
  };
}

const digits = (h, position = "end") => h.c.data.reels.map((reel) => {
  const offset = Number(reel.style.match(new RegExp(`--reel-${position}: (-?[\\d.]+)em`))?.[1] || 0);
  return reel.digits[Math.round(-offset / 1.2)].value;
}).join("").trim();

test("parking capacity is visible immediately before rolling to the first live count", () => {
  for (const [capacity, remaining] of [[508, 128], [205, 46]]) {
    const h = harness(capacity);
    assert.equal(digits(h), String(capacity));
    assert.equal(h.timers.size, 0);
    h.set(remaining);
    assert.equal(digits(h, "start"), String(capacity));
    h.finish();
    assert.equal(digits(h), String(remaining));
  }
});

test("only changed digits move and single-step changes travel exactly one cell", () => {
  for (const [from, to] of [[5, 4], [4, 5], [15, 14], [19, 20], [20, 19]]) {
    const h = harness(from);
    h.set(to);
    assert.equal(digits(h, "start"), String(from));
    assert.equal(digits(h), String(to));
    const moving = h.c.data.reels.filter((reel) => reel.spinning);
    assert.ok(moving.length > 0);
    assert.ok(moving.every((reel) => reel.digits.length === 2));
    assert.ok(moving.every((reel) => /285ms/.test(reel.style)));
    if (from === 15) assert.equal(h.c.data.reels[0].spinning, false);
    h.finish();
    assert.equal(digits(h), String(to));
  }
});

test("larger differences use only the required steps and settle at the exact count", () => {
  const h = harness();
  assert.equal(h.c.data.ready, false);
  h.set(328);
  assert.equal(h.c.data.reels.length, 3);
  assert.deepEqual(Array.from(h.c.data.reels, (reel) => reel.digits.length), [4, 3, 9]);
  assert.equal(digits(h), "328");
  h.finish();
  assert.equal(digits(h), "328");
  assert.ok(h.c.data.reels.every((reel) => !reel.spinning));
  h.set(328);
  assert.equal(h.timers.size, 0);
});

test("increases move up and decreases move down, including carrying and borrowing", () => {
  for (const [from, to] of [[4, 5], [5, 4], [19, 20], [20, 19], [99, 100], [100, 99]]) {
    const h = harness(from);
    h.set(to);
    assert.equal(digits(h, "start"), String(from));
    assert.equal(digits(h), String(to));
    for (const reel of h.c.data.reels.filter((item) => item.spinning)) {
      const start = Number(reel.style.match(/--reel-start: (-?[\d.]+)em/)[1]);
      const end = Number(reel.style.match(/--reel-end: (-?[\d.]+)em/)[1]);
      assert.ok(to > from ? end < start : end > start);
    }
    h.finish();
    assert.equal(digits(h), String(to));
  }
});

test("digit boundaries and zero end without leading zeros", () => {
  const h = harness();
  for (const value of [99, 100, 9, 0, 508]) {
    h.set(value);
    assert.equal(digits(h), String(value));
    h.finish();
    assert.equal(digits(h), String(value));
    assert.equal(h.c.data.reels.length, String(value).length);
  }
});

test("rapid updates finish the current spin then go directly to the newest target", () => {
  const h = harness();
  h.set(300);
  const firstReels = h.c.data.reels;
  h.set(240);
  h.set(12);
  assert.equal(h.c.data.reels, firstReels);
  assert.equal(h.timers.size, 1);
  h.finish();
  assert.equal(digits(h), "12");
  assert.equal(h.timers.size, 1);
  h.finish();
  assert.equal(digits(h), "12");
  assert.equal(h.timers.size, 0);
});

test("hidden pages settle immediately and detached components leave no timers", () => {
  const h = harness();
  h.set(230);
  h.hide();
  assert.equal(h.timers.size, 0);
  assert.equal(digits(h), "230");
  h.set(20);
  assert.equal(h.timers.size, 0);
  assert.equal(digits(h), "20");
  h.show();
  h.set(40);
  h.detach();
  assert.equal(h.timers.size, 0);
});

test("settled text follows the latest count after queued animations and page hiding", () => {
  const h = harness(111);
  assert.equal(h.c.data.displayValue, "111");
  assert.equal(h.c.data.rolling, false);

  h.set(112);
  assert.equal(h.c.data.rolling, true);
  h.set(119);
  h.finish();
  assert.equal(h.c.data.rolling, true);
  h.finish();
  assert.equal(h.c.data.rolling, false);
  assert.equal(h.c.data.displayValue, "119");

  h.set(0);
  h.hide();
  assert.equal(h.c.data.rolling, false);
  assert.equal(h.c.data.displayValue, "0");
  assert.equal(h.timers.size, 0);
  h.set(9);
  assert.equal(h.c.data.displayValue, "9");
  assert.equal(h.c.data.rolling, false);
});
