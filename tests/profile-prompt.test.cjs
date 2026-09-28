const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const legacyUser = {
  _id: "user-1",
  nickName: "微信用户",
  avatarUrl: "https://thirdwx.qlogo.cn/mmopen/vi_32/legacy-avatar",
  company: "company-1",
};
const flush = () => new Promise(setImmediate);

// Execute the app's actual handlers with an in-memory database and WeChat API stubs.
function load(relativePath, globals, suffix = "") {
  const source = fs.readFileSync(path.join(root, relativePath), "utf8")
    .replace(/^import\s+[\s\S]*?from\s+["'][^"']+["'];\s*/gm, "")
    .replace(/^export /gm, "");
  return vm.runInNewContext(source + suffix, globals, { filename: relativePath });
}

function instantiate(definition) {
  return {
    ...definition,
    ...definition.methods,
    data: JSON.parse(JSON.stringify(definition.data)),
    setData(changes) { Object.assign(this.data, changes); },
  };
}

function createHarness(initialUser = legacyUser) {
  let storedUser = initialUser && { ...initialUser };
  let failWrite = false;
  let app;
  let onboardingCount = 0;
  let loading = false;
  const toasts = [];
  const uploads = [];
  const wx = {
    removeStorageSync() {},
    showLoading() { loading = true; },
    hideLoading() { loading = false; },
    showToast(toast) { toasts.push(toast); },
    cloud: {
      database: () => ({
        command: {},
        collection: () => ({
          get: async () => ({ data: storedUser ? [{ ...storedUser }] : [] }),
          doc: (id) => ({
            update: async ({ data }) => {
              if (failWrite) throw new Error("Simulated database write failure");
              assert.equal(id, storedUser._id);
              storedUser = { ...storedUser, ...data };
              // Database writes return metadata, not the updated user document.
              return { stats: { updated: 1 } };
            },
          }),
        }),
      }),
      uploadFile: async (request) => {
        uploads.push(request);
        return { fileID: "cloud://test/avatars/new-avatar.png" };
      },
    },
  };
  load("miniprogram/app.js", { App: (definition) => { app = definition; } });
  const globals = { getApp: () => app, wx, console: { log() {}, error() {} } };
  const repo = load("miniprogram/repository/userRepo.js", globals,
    "\n;({ fetchUserInfo, updateUserInfo });");

  function createPage(fetchUserInfo = repo.fetchUserInfo) {
    let definition;
    load("miniprogram/pages/index/index.js", {
      ...globals,
      fetchUserInfo,
      navigateToOnboarding: () => { onboardingCount++; },
      Page: (value) => { definition = value; },
    });
    return instantiate(definition);
  }

  async function createModal(page) {
    let definition;
    load("miniprogram/components/user-info-modal/index.js", {
      ...globals, ...repo, Component: (value) => { definition = value; },
    });
    const modal = instantiate(definition);
    modal.triggerEvent = (name) => {
      assert.equal(name, "close");
      page.hideModal();
    };
    definition.lifetimes.attached.call(modal);
    await flush();
    return modal;
  }

  return {
    app, repo, createPage, createModal, toasts, uploads,
    get storedUser() { return storedUser; },
    get loading() { return loading; },
    get onboardingCount() { return onboardingCount; },
    set failWrite(value) { failWrite = value; },
    setUser(user) { storedUser = { ...user }; },
  };
}

async function selectTab(page, tab) {
  page.onTabSelect({ currentTarget: { dataset: { tabid: tab } } });
  await flush();
}

test("closing the reminder prevents repeats across tabs and recreated pages", async () => {
  const h = createHarness();
  const page = h.createPage();
  const modal = await h.createModal(page);
  await selectTab(page, "mall");
  assert.equal(page.data.showingModal, "update-userinfo");
  modal.onClose();
  for (const tab of ["connection", "user", "board", "mall"]) {
    await selectTab(page, tab);
    assert.equal(page.data.showingModal, null);
  }
  const recreated = h.createPage();
  await selectTab(recreated, "user");
  assert.equal(recreated.data.showingModal, null);
});

test("an overlapping profile request cannot reopen a dismissed reminder", async () => {
  const h = createHarness();
  const pending = [];
  const page = h.createPage(() => new Promise((resolve) => pending.push(resolve)));
  page.onTabSelect({ currentTarget: { dataset: { tabid: "mall" } } });
  page.onTabSelect({ currentTarget: { dataset: { tabid: "connection" } } });
  pending[0]({ ...legacyUser });
  await flush();
  assert.equal(page.data.showingModal, "update-userinfo");
  page.hideModal();
  pending[1]({ ...legacyUser });
  await flush();
  assert.equal(page.data.showingModal, null);
});

test("updated profiles are not prompted even with a legacy avatar or default nickname", async () => {
  for (const nickName of ["微信用户", "My nickname"]) {
    const h = createHarness({ ...legacyUser, nickName, updatedAt: 123456789 });
    const page = h.createPage();
    await selectTab(page, "mall");
    assert.equal(page.data.showingModal, null);
  }
});

test("nickname-only save preserves the full user and stops reminders in a new session", async () => {
  const h = createHarness();
  const page = h.createPage();
  const modal = await h.createModal(page);
  await selectTab(page, "mall");
  await modal.onFormSubmit({ detail: { value: { nickName: "New nickname" } } });
  assert.equal(h.loading, false);
  assert.equal(h.toasts.at(-1).icon, "success");
  assert.equal(h.uploads.length, 0);
  assert.equal(page.data.showingModal, null);
  assert.equal(h.app.globalData.userInfo._id, legacyUser._id);
  assert.equal(h.app.globalData.userInfo.company, legacyUser.company);
  assert.equal(h.app.globalData.userInfo.avatarUrl, legacyUser.avatarUrl);
  assert.equal(h.app.globalData.userInfo.nickName, "New nickname");
  assert.ok(h.app.globalData.userInfo.updatedAt > 0);
  assert.equal(h.app.globalData.userInfo.updatedAt, h.storedUser.updatedAt);
  const restarted = createHarness(h.storedUser);
  const nextPage = restarted.createPage();
  await selectTab(nextPage, "user");
  assert.equal(nextPage.data.showingModal, null);
});

test("avatar and nickname save updates the document and cached user", async () => {
  const h = createHarness();
  const page = h.createPage();
  const modal = await h.createModal(page);
  await selectTab(page, "mall");
  modal.onChooseAvatar({ detail: { avatarUrl: "tmp://chosen-avatar.png" } });
  await modal.onFormSubmit({ detail: { value: { nickName: "New nickname" } } });
  assert.equal(h.uploads.length, 1);
  assert.equal(h.uploads[0].filePath, "tmp://chosen-avatar.png");
  assert.equal(h.storedUser.avatarUrl, "cloud://test/avatars/new-avatar.png");
  assert.equal(h.app.globalData.userInfo.avatarUrl, h.storedUser.avatarUrl);
  assert.equal(h.app.globalData.userInfo._id, legacyUser._id);
});

test("failed save preserves the user and open form so saving can be retried", async () => {
  const h = createHarness();
  const page = h.createPage();
  const modal = await h.createModal(page);
  await selectTab(page, "mall");
  const cachedUser = h.app.globalData.userInfo;
  h.failWrite = true;
  await modal.onFormSubmit({ detail: { value: { nickName: "New nickname" } } });
  assert.equal(h.loading, false);
  assert.equal(h.toasts.at(-1).icon, "error");
  assert.equal(h.app.globalData.userInfo, cachedUser);
  assert.equal(h.storedUser.updatedAt, undefined);
  assert.equal(page.data.showingModal, "update-userinfo");
  h.failWrite = false;
  await modal.onFormSubmit({ detail: { value: { nickName: "New nickname" } } });
  assert.equal(h.toasts.at(-1).icon, "success");
  assert.equal(page.data.showingModal, null);
});

test("reminders remain available to another user and reset in a new app session", async () => {
  const h = createHarness();
  const page = h.createPage();
  await selectTab(page, "user");
  page.hideModal();
  h.setUser({ ...legacyUser, _id: "user-2" });
  await selectTab(page, "mall");
  assert.equal(page.data.showingModal, "update-userinfo");
  page.hideModal();
  h.setUser(legacyUser);
  await selectTab(page, "user");
  assert.equal(page.data.showingModal, null);
  const restarted = createHarness();
  const nextPage = restarted.createPage();
  await selectTab(nextPage, "user");
  assert.equal(nextPage.data.showingModal, "update-userinfo");
});

test("visitors reach onboarding without the hidden modal crashing", async () => {
  const h = createHarness(null);
  const page = h.createPage();
  await h.createModal(page);
  await selectTab(page, "mall");
  assert.equal(page.data.showingModal, null);
  assert.equal(page.data.currentTab, "board");
  assert.equal(h.onboardingCount, 1);
});

test("a complete legacy profile does not trigger the reminder", async () => {
  const h = createHarness({ ...legacyUser, nickName: "My nickname", avatarUrl: "cloud://test/avatar.png" });
  const page = h.createPage();
  await selectTab(page, "connection");
  assert.equal(page.data.showingModal, null);
});
