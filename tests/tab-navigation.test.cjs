const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const flush = () => new Promise(setImmediate);

function harness() {
  let definition, resolveConfig, userCalls = 0;
  const config = new Promise((resolve) => { resolveConfig = resolve; });
  const app = { globalData: { profilePromptedUserIds: [], statusBarHeight: 44, windowWidth: 375 } };
  const source = fs.readFileSync(path.join(__dirname, "../miniprogram/pages/index/index.js"), "utf8")
    .replace(/^import\s+[\s\S]*?from\s+["'][^"']+["'];\s*/gm, "");
  vm.runInNewContext(source, {
    setTimeout,
    clearTimeout,
    getApp: () => app,
    Page: (value) => { definition = value; },
    getAppConfig: () => config,
    fetchUserInfo: async () => { userCalls++; return { _id: "user-1", updatedAt: 1 }; },
    wx: { removeStorageSync() {}, setStorageSync() {} },
    navigateToOnboarding() {},
  });
  const page = { ...definition, data: JSON.parse(JSON.stringify(definition.data)),
    setData(changes) { Object.assign(this.data, changes); } };
  return { page, resolveConfig, get userCalls() { return userCalls; },
    select(tab) { page.onTabSelect({ currentTarget: { dataset: { tabid: tab } } }); } };
}

test("tab widths retain the original calculation before and after feature flags", async () => {
  for (const featureFlags of [{}, { mallEnabled: false }, { carpoolEnabled: true }]) {
    const h = harness();
    h.page.onLoad({});
    assert.equal(h.page.data.tabWidth, 75);
    h.resolveConfig({ featureFlags });
    await flush();
    assert.equal(h.page.data.tabWidth, 75);
    h.select("user");
    assert.equal(h.page.data.tabWidth, 75);
  }
});

test("fast tab selections stay in sync and selecting the current tab is a no-op", async () => {
  const h = harness();
  for (const tab of ["mall", "connection", "user", "board", "user"]) h.select(tab);
  await flush();
  assert.equal(h.page.data.currentTab, "user");
  const calls = h.userCalls;
  h.select("user");
  h.select("invalid");
  await flush();
  assert.equal(h.userCalls, calls);
  assert.equal(h.page.data.currentTab, "user");
});

test("late configuration does not undo a user selection", async () => {
  const h = harness();
  h.page.onLoad({ page: "mall" });
  h.select("user");
  h.resolveConfig({ featureFlags: { carpoolEnabled: true } });
  await flush();
  assert.equal(h.page.data.currentTab, "user");
  assert.equal(h.page.data.pages.length, 5);
});

test("highlight aligns with the rendered button without changing its layout", async () => {
  const h = harness();
  h.page.data.currentTab = "connection";
  h.page.createSelectorQuery = () => {
    const query = {
      select() { return query; },
      boundingClientRect() { return query; },
      exec(callback) {
        callback([{ left: 0 }, { left: 210.5, width: 101.328125 }]);
      },
    };
    return query;
  };
  h.page.alignTabIndicator();
  await new Promise((resolve) => setTimeout(resolve, 410));
  assert.equal(h.page.data.tabIndicatorWidth, 101.328125);
  const x = 12 + h.page.data.tabIndicatorOffset * h.page.data.tabIndicatorWidth / 100;
  assert.equal(x, 210.5);
  assert.equal(h.page.data.currentTab, "connection");
  h.page.onUnload();
});
