const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
// Public Tencent US quotes captured on 2026-10-09, for the 2026-10-08 close.
const fixture = fs.readFileSync(path.join(__dirname, 'fixtures/tencent-stock-quotes.txt'), 'utf8');
const symbols = ['MSFT', 'AAPL', 'NVDA', 'GOOG'];
const now = Date.UTC(2026, 9, 9, 7);
const clone = (value) => JSON.parse(JSON.stringify(value));
const flush = () => new Promise(setImmediate);

function backend(options = {}) {
  const records = new Map(options.record ? [[options.record.key, clone(options.record)]] : []);
  let writes = 0;
  const requests = [];
  class Clock extends Date {
    constructor(...args) { super(...(args.length ? args : [now])); }
    static now() { return now; }
  }
  const cloud = {
    init() {}, DYNAMIC_CURRENT_ENV: 'test',
    database: () => ({ collection(name) {
      assert.equal(name, 'appconfig');
      return {
        where(query) {
          assert.ok(['stockDataCache', 'stockDataCacheV2'].includes(query.key));
          return {
            async get() {
              if (options.readError) throw Error('Database unavailable');
              const record = records.get(query.key);
              return { data: record ? [clone(record)] : [] };
            },
            async update({ data }) {
              assert.equal(query.key, 'stockDataCacheV2');
              if (options.writeError) throw Error('Database unavailable');
              const record = records.get(query.key);
              if (!record) return { stats: { updated: 0 } };
              writes++; records.set(query.key, { ...record, ...clone(data) });
              return { stats: { updated: 1 } };
            },
          };
        },
        async add({ data }) {
          assert.equal(data.key, 'stockDataCacheV2');
          writes++; records.set(data.key, clone(data)); return { _id: 'cache' };
        },
      };
    } }),
  };
  const http = { get(request) {
    requests.push(request);
    return Promise.resolve().then(() => options.http ? options.http(request) : fixture);
  } };
  function load(relative, dependencies) {
    const module = { exports: {} };
    vm.runInNewContext(fs.readFileSync(path.join(root, relative), 'utf8'), {
      module, exports: module.exports, Date: Clock,
      console: { error() {} },
      require(name) {
        if (!(name in dependencies)) throw Error(`Unexpected dependency: ${name}`);
        return dependencies[name];
      },
    }, { filename: relative });
    return module.exports;
  }
  const utils = load('cloudfunctions/stockFunctions/lib/stock-utils.js', {
    'wx-server-sdk': cloud, 'request-promise': http,
  });
  const action = load('cloudfunctions/stockFunctions/index.js', {
    './lib/stock-utils': utils,
  });
  return { utils, run: action.main, requests,
    get record() { return records.get('stockDataCacheV2') || records.get('stockDataCache'); },
    get legacyRecord() { return records.get('stockDataCache'); }, get writes() { return writes; } };
}

async function cachedRecord(age) {
  const h = backend();
  await h.run();
  const record = clone(h.record);
  record.value.timestamp = now - age;
  record.updateTime = new Date(now - age).toISOString();
  return record;
}

test('real provider response preserves prices, percent changes, market cap units and ranking', async () => {
  const h = backend();
  const response = await h.run();
  assert.equal(response.code, 0);
  assert.deepEqual(Array.from(response.data.stocks, s => s.symbol), ['NVDA', 'AAPL', 'GOOG', 'MSFT']);
  assert.equal(response.data.msft.price, '522.61');
  assert.equal(response.data.msft.change, '-1.35'); // Percentage, not the $7.15 price change.
  assert.equal(response.data.msft.mktcap, '3880.66B');
  assert.equal(response.data.timestamp, now);
  assert.equal(response.data.stale, false);
  assert.equal(h.requests.length, 1);
  assert.equal(h.requests[0].uri, 'https://qt.gtimg.cn/q=usMSFT,usAAPL,usNVDA,usGOOG');
  assert.ok(h.requests[0].timeout <= 5000);
  assert.equal(h.writes, 1);
});

test('recent shared cache avoids another upstream request without changing its timestamp', async () => {
  const record = await cachedRecord(5 * 60 * 1000);
  const h = backend({ record });
  const response = await h.run();
  assert.equal(h.requests.length, 0);
  assert.equal(response.data.fromCache, true);
  assert.equal(response.data.stale, false);
  assert.equal(response.data.timestamp, record.value.timestamp);
  assert.equal(h.writes, 0);
  assert.deepEqual(h.record, record);
});

test('a failed refresh keeps a cross-day cache and exposes its actual age', async () => {
  const record = await cachedRecord(3 * 24 * 60 * 60 * 1000);
  const h = backend({ record, http: () => { throw Error('Upstream unavailable'); } });
  const response = await h.run();
  assert.equal(response.code, 0);
  assert.equal(response.data.fromCache, true);
  assert.equal(response.data.stale, true);
  assert.equal(response.data.timestamp, record.value.timestamp);
  assert.equal(h.writes, 0);
  assert.deepEqual(h.record, record);
});

test('old cache refreshes normally and replaces the stored snapshot', async () => {
  const h = backend({ record: await cachedRecord(24 * 60 * 60 * 1000) });
  const response = await h.run();
  assert.equal(response.data.fromCache, false);
  assert.equal(response.data.timestamp, now);
  assert.equal(h.record.value.timestamp, now);
  assert.equal(h.requests.length, 1);
});

test('a legacy production cache can seed the new function without ever being overwritten', async () => {
  const record = await cachedRecord(3 * 24 * 60 * 60 * 1000);
  record.key = 'stockDataCache';
  const h = backend({ record });
  assert.equal((await h.run()).code, 0);
  assert.equal(h.record.key, 'stockDataCacheV2');
  assert.deepEqual(h.legacyRecord, record);
  const failing = backend({ record, http: () => { throw Error('Unavailable'); } });
  const response = await failing.run();
  assert.equal(response.code, 0);
  assert.equal(response.data.stale, true);
  assert.deepEqual(failing.legacyRecord, record);
  assert.equal(failing.writes, 0);
});

test('unusable or over-seven-day caches cannot become current quotes during an outage', async () => {
  const expired = await cachedRecord(8 * 24 * 60 * 60 * 1000);
  const malformed = await cachedRecord(60 * 1000);
  malformed.value.stocks[0].mktcap = 'not a number';
  const future = await cachedRecord(-60 * 1000);
  for (const record of [undefined, expired, malformed, future]) {
    const h = backend({ record, http: () => { throw Error('Unavailable'); } });
    const response = await h.run();
    assert.equal(response.code, -1);
    assert.equal(response.data, null);
    assert.equal(h.writes, 0);
  }
});

test('partial quotes and invalid currencies are rejected instead of displaying incomplete rankings', () => {
  const { utils } = backend();
  assert.throws(() => utils.parseQuotes(fixture.replace(/^v_usMSFT=.*\r?\n/m, ''), symbols), /Incomplete/);
  assert.throws(() => utils.parseQuotes(fixture.replace('~USD~', '~HKD~'), symbols), /Invalid quote/);
  assert.throws(() => utils.parseQuotes('<html>Service unavailable</html>', symbols), /Incomplete/);
});

test('simultaneous requests on one function instance share a single upstream fetch', async () => {
  let resolve;
  const pending = new Promise(r => { resolve = r; });
  const h = backend({ http: () => pending });
  const calls = [h.run(), h.run()];
  await flush();
  assert.equal(h.requests.length, 1);
  resolve(fixture);
  const responses = await Promise.all(calls);
  assert.ok(responses.every(r => r.code === 0));
});

test('cache read or write failures do not hide successful live quotes', async () => {
  for (const options of [{ readError: true }, { writeError: true }]) {
    const h = backend(options);
    assert.equal((await h.run()).code, 0);
  }
});

function card() {
  let definition;
  let nextTimer = 0;
  const timers = new Map();
  const requests = [];
  const updates = [];
  const source = fs.readFileSync(path.join(root, 'miniprogram/components/stockV2/stockV2.js'), 'utf8')
    .replace(/^import\s+[\s\S]*?from\s+["'][^"']+["'];\s*/gm, '');
  vm.runInNewContext(source, {
    Component(value) { definition = value; },
    console: { error() {} },
    fetchStockData: () => new Promise((resolve, reject) => requests.push({ resolve, reject })),
    setTimeout(callback) { timers.set(++nextTimer, callback); return nextTimer; },
    clearTimeout(id) { timers.delete(id); },
  });
  const component = {
    ...definition.methods, data: clone(definition.data),
    setData(data) { updates.push(data); Object.assign(this.data, data); },
  };
  definition.lifetimes.attached.call(component);
  return { component, requests, timers, updates,
    detach() { definition.lifetimes.detached.call(component); },
    timeout() { for (const callback of [...timers.values()]) callback(); } };
}

test('the card renders the backend result without mutating cached API values', async () => {
  const response = await backend().run();
  const original = clone(response);
  const h = card();
  h.requests[0].resolve(response);
  await flush();
  assert.equal(h.component.data.loadingStockData, false);
  assert.equal(h.component.data.hasStockData, true);
  assert.equal(h.component.data.stockData.top1.mktcap, '5.57');
  assert.equal(h.component.data.stockData.msft.change, '-1.35');
  assert.equal(h.component.data.stockData.msftTop1, false);
  assert.deepEqual(clone(response), original);
  assert.equal(h.timers.size, 0);
});

test('service errors leave loading and a retry can recover', async () => {
  const h = card();
  h.requests[0].resolve({ code: -1, data: null });
  await flush();
  assert.equal(h.component.data.loadingStockData, false);
  assert.equal(h.component.data.hasStockData, false);
  assert.equal(h.component.data.stockDataError, true);
  const retry = h.component.fetchAndProcessStockData();
  h.requests[1].resolve(await backend().run());
  await retry;
  assert.equal(h.component.data.stockDataError, false);
  assert.equal(h.component.data.hasStockData, true);
});

test('a timeout finishes loading and its late response cannot overwrite a successful retry', async () => {
  const h = card();
  await h.component.fetchAndProcessStockData(); // Repeated taps do not create more requests.
  assert.equal(h.requests.length, 1);
  h.timeout();
  await flush();
  assert.equal(h.component.data.loadingStockData, false);
  assert.equal(h.component.data.stockDataError, true);
  const retry = h.component.fetchAndProcessStockData();
  const response = await backend().run();
  h.requests[1].resolve(response);
  await retry;
  const displayed = clone(h.component.data);
  const oldResponse = clone(response);
  oldResponse.data.msft.price = '1.00';
  h.requests[0].resolve(oldResponse);
  await flush();
  assert.deepEqual(clone(h.component.data), displayed);
  assert.equal(h.timers.size, 0);
});

test('stale data is marked and a failed retry preserves the last displayed prices', async () => {
  const response = await backend().run();
  response.data.stale = true;
  response.data.timestamp = now - 3 * 24 * 60 * 60 * 1000;
  const h = card();
  h.requests[0].resolve(response);
  await flush();
  assert.equal(h.component.data.usingCachedData, true);
  assert.equal(h.component.data.stockUpdatedAt, '10/6');
  const previous = clone(h.component.data.stockData);
  const retry = h.component.fetchAndProcessStockData();
  h.requests[1].reject(Error('Network unavailable'));
  await retry;
  assert.equal(h.component.data.stockDataError, true);
  assert.equal(h.component.data.hasStockData, true);
  assert.deepEqual(clone(h.component.data.stockData), previous);
});

test('malformed data does not leave the card loading or display placeholder prices as real data', async () => {
  for (const mutate of [
    r => { r.data.msft = null; },
    r => { r.data.stocks = r.data.stocks.slice(0, 3); },
    r => { r.data.stocks[0].mktcap = 'NaNB'; },
  ]) {
    const response = clone(await backend().run());
    mutate(response);
    const h = card();
    h.requests[0].resolve(response);
    await flush();
    assert.equal(h.component.data.loadingStockData, false);
    assert.equal(h.component.data.hasStockData, false);
    assert.equal(h.component.data.stockDataError, true);
  }
});

test('detaching clears the timeout and ignores an outstanding response', async () => {
  const h = card();
  h.detach();
  const count = h.updates.length;
  h.requests[0].resolve(await backend().run());
  await flush();
  assert.equal(h.timers.size, 0);
  assert.equal(h.updates.length, count);
});
