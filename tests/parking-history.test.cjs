const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { EventEmitter } = require('node:events');
const { createHandler, localTime, validateConfig } = require('../cloudfunctions/parkingHistory/history');
const config = require('../cloudfunctions/parkingHistory/config');
const { parseSpaces } = require('../cloudfunctions/parkingHistory/source');

const COLLECT = { Type: 'Timer', TriggerName: 'parking-history-collect' };
const CLEANUP = { Type: 'Timer', TriggerName: 'parking-history-cleanup' };
const time = value => Date.parse(value + '+08:00');

function harness(options = {}) {
  let now = time(options.at || '2026-10-26T09:00:00');
  let requests = 0;
  const records = new Map();
  const removed = [];
  const reads = [];
  const workdayChecks = [];
  const db = {
    command: { lt: value => ({ lt: value }) },
    collection(name) {
      assert.equal(name, 'parking-history');
      return {
        doc(id) {
          return {
            async set({ data }) {
              if (options.writeError) throw new Error('Write failed');
              records.set(id, { ...data, _id: id });
            },
            async remove() {
              if (options.removeError) throw new Error('Remove failed');
              removed.push(id);
              records.delete(id);
            },
          };
        },
        where(query) {
          let limit = 100, skip = 0;
          const chain = {
            orderBy(field, direction) {
              assert.equal(field, 'minute'); assert.equal(direction, 'asc');
              return chain;
            },
            skip(value) { skip = value; return chain; },
            limit(value) { limit = value; return chain; },
            async get() {
              reads.push(query);
              if (options.readError) throw new Error('Read failed');
              const values = [...records.values()].filter(item =>
                typeof query.date === 'string' ? item.date === query.date : item.date < query.date.lt);
              values.sort((a, b) => a.minute - b.minute);
              return { data: values.slice(skip, skip + limit) };
            },
          };
          return chain;
        },
      };
    },
  };
  const handle = createHandler({
    db, config: { ...config, ...options.config }, clock: () => now,
    async isWorkday(date) {
      workdayChecks.push(date);
      if (options.calendarError) throw new Error('Calendar unavailable');
      if (options.isWorkday) return options.isWorkday(date);
      if (options.workday !== undefined) return options.workday;
      const weekday = new Date(date).getUTCDay();
      return weekday !== 0 && weekday !== 6;
    },
    async fetchSpaces() {
      requests++;
      if (options.sourceError) throw new Error('Source failed');
      return { b25: 0, zhongmeng: 42 };
    },
  });
  return {
    handle, records, removed, reads, workdayChecks,
    get requests() { return requests; },
    setTime(value) { now = time(value); },
    query(date) { return handle({ action: 'history', data: { date } }); },
  };
}

test('source parses both lots in one response, preserving real zero', () => {
  assert.deepEqual(parseSpaces({ msparkingData: [
    { areaCode: '12', areaFreeSpaceNum: '0' }, { areaCode: 2, areaFreeSpaceNum: 42 },
  ] }), { b25: 0, zhongmeng: 42 });
  for (const value of [null, '', -1, 1.5, false, 'unknown', Infinity]) {
    assert.throws(() => parseSpaces({ msparkingData: [
      { areaCode: 12, areaFreeSpaceNum: value }, { areaCode: 2, areaFreeSpaceNum: 42 },
    ] }));
  }
  assert.throws(() => parseSpaces({ msparkingData: [{ areaCode: 12, areaFreeSpaceNum: 3 }] }));
  assert.throws(() => parseSpaces({}));
  assert.throws(() => parseSpaces({ msparkingData: [
    { areaCode: 12, areaFreeSpaceNum: 3 }, { areaCode: 12, areaFreeSpaceNum: 4 },
    { areaCode: 2, areaFreeSpaceNum: 5 },
  ] }));
});

test('Shanghai date is independent of host timezone and crosses UTC midnight correctly', () => {
  assert.deepEqual(localTime(Date.parse('2026-10-25T16:00:00Z')), {
    date: '2026-10-26', weekday: 1, minute: 0,
  });
});

test('timer samples without any page view, merging both lots in an idempotent slot', async () => {
  const h = harness();
  await h.handle(COLLECT);
  await h.handle(COLLECT);
  assert.equal(h.requests, 2);
  assert.equal(h.records.size, 1);
  const record = h.records.get('2026-10-26-540');
  assert.equal(record.b25, 0);
  assert.equal(record.zhongmeng, 42);
  assert.equal(record.intervalMinutes, 5);
  assert.equal(record.window, 'morning');
});

test('non-workdays, off-hours and unaligned minutes never call the parking source or write', async () => {
  for (const at of [
    '2026-10-24T09:00:00', '2026-10-25T09:00:00', '2026-10-26T07:25:00',
    '2026-10-26T10:35:00', '2026-10-26T12:00:00', '2026-10-26T16:25:00',
    '2026-10-26T19:35:00', '2026-10-26T09:01:00', '2026-10-26T16:35:00',
  ]) {
    const h = harness({ at });
    assert.equal((await h.handle(COLLECT)).skipped, true);
    assert.equal(h.requests, 0);
    assert.equal(h.records.size, 0);
  }
  const h = harness({ at: '2026-10-01T09:00:00', workday: false });
  await h.handle(COLLECT);
  assert.equal(h.requests, 0);
});

test('both peak windows include their boundaries and use independent five/ten-minute intervals', async () => {
  const h = harness();
  for (const time of ['07:30', '07:35', '10:25', '10:30', '16:30', '16:40', '19:20', '19:30']) {
    h.setTime(`2026-10-26T${time}:00`);
    assert.equal((await h.handle(COLLECT)).recorded, true);
  }
  assert.equal(h.requests, 8);
  assert.equal(h.records.get('2026-10-26-450').intervalMinutes, 5);
  assert.equal(h.records.get('2026-10-26-990').intervalMinutes, 10);
  assert.equal(h.records.get('2026-10-26-1170').window, 'evening');
});

test('times are relative to each configured start, and off-window calls do not even load the calendar', async () => {
  const h = harness({
    config: { windows: [
      { name: 'morning', startMinute: 455, endMinute: 635, intervalMinutes: 10 },
      config.windows[1],
    ] },
  });
  h.setTime('2026-10-26T07:35:00');
  await h.handle(COLLECT);
  h.setTime('2026-10-26T07:40:00');
  await h.handle(COLLECT);
  h.setTime('2026-10-26T12:00:00');
  await h.handle(COLLECT);
  assert.equal(h.requests, 1);
  assert.equal(h.workdayChecks.length, 1);
});

test('automatic workday decisions allow weekend makeup days, and calendar failure never guesses', async () => {
  const h = harness({ at: '2026-10-10T09:00:00', workday: true });
  assert.equal((await h.handle(COLLECT)).recorded, true);
  const unavailable = harness({ calendarError: true });
  await assert.rejects(unavailable.handle(COLLECT), /Calendar unavailable/);
  assert.equal(unavailable.requests, 0);
  assert.equal(unavailable.records.size, 0);
});

test('exact schedule produces 37 morning plus 19 evening records, bounded to 448 over eight workdays', async () => {
  const h = harness({ workday: true });
  for (const date of [
    '2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29',
    '2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02',
  ]) {
    for (let minute = 0; minute < 1440; minute += 5) {
      h.setTime(`${date}T${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}:00`);
      await h.handle(COLLECT);
    }
  }
  assert.equal(h.requests, 448);
  assert.equal(h.records.size, 448);
  const first = (await h.query('2026-10-26')).samples;
  assert.equal(first.filter(sample => sample.window === 'morning').length, 37);
  assert.equal(first.filter(sample => sample.window === 'evening').length, 19);
  assert.equal((await h.handle(CLEANUP)).removed, 0);
  h.setTime('2026-11-03T00:05:00');
  assert.equal((await h.handle(CLEANUP)).removed, 56);
  assert.equal(h.records.size, 392);
  assert.equal(h.records.has('2026-10-27-450'), true);
});

test('spoofed client timers cannot write or delete, and unknown actions fail', async () => {
  for (const identity of [
    { OPENID: 'user' }, { APPID: 'app' }, { UNIONID: 'user' },
    { SOURCE: 'wx_client' }, { SOURCE: 'wx_client,scf' }, { SOURCE: 'http' },
  ]) {
    const h = harness();
    await assert.rejects(h.handle(COLLECT, identity), /cannot be invoked/);
    await assert.rejects(h.handle(CLEANUP, identity), /cannot be invoked/);
    assert.equal(h.requests, 0);
    assert.equal(h.reads.length, 0);
    assert.equal(h.workdayChecks.length, 0);
  }
  await assert.rejects(harness().handle({ Type: 'Timer', TriggerName: 'other' }), /Unknown/);
  await assert.rejects(harness().handle({ action: 'delete' }), /Unknown/);
});

test('errors propagate; failed sampling does not create a zero-shaped fallback', async () => {
  const h = harness({ sourceError: true });
  await assert.rejects(h.handle(COLLECT), /Source failed/);
  assert.equal(h.records.size, 0);
  await assert.rejects(harness({ writeError: true }).handle(COLLECT), /Write failed/);
  await assert.rejects(harness({ readError: true }).query('2026-10-25'), /Read failed/);
  const brokenCleanup = harness({ removeError: true });
  brokenCleanup.records.set('old', { _id: 'old', date: '2026-10-01' });
  await assert.rejects(brokenCleanup.handle(CLEANUP), /Remove failed/);
});

test('history allows exactly D-7 through D-1, rejects today and all other dates, and is strictly read-only', async () => {
  const h = harness();
  for (const date of ['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24', '2026-10-25']) {
    const history = await h.query(date);
    assert.deepEqual(history.samples, []);
    assert.equal(history.earliest, '2026-10-19');
    assert.equal(history.latest, '2026-10-25');
    assert.equal(history.timezone, 'Asia/Shanghai');
    assert.deepEqual(history.windows, config.windows);
  }
  for (const date of ['2026-10-18', '2026-10-26', '2026-10-27', '2026-02-30', {}, null, '2026-1-1']) {
    await assert.rejects(h.query(date), /outside/);
  }
  assert.equal(h.requests, 0);
  assert.equal(h.records.size, 0);
  assert.equal(h.removed.length, 0);
  assert.equal(h.workdayChecks.length, 0);
});

test('longer physical retention cannot expand the seven-day public query window', async () => {
  const h = harness({ config: { retentionDays: 31 } });
  h.records.set('old', { _id: 'old', date: '2026-10-18', minute: 540, b25: 1, zhongmeng: 2 });
  await assert.rejects(h.query('2026-10-18'), /outside/);
  await assert.rejects(h.query('2026-10-26'), /outside/);
  assert.equal(h.reads.length, 0);
  assert.equal((await h.query('2026-10-19')).earliest, '2026-10-19');
});

test('today is still collected for tomorrow, but cannot be read as a completed historical day', async () => {
  const h = harness();
  await h.handle(COLLECT);
  await assert.rejects(h.query('2026-10-26'), /today excluded/);
  h.setTime('2026-10-27T00:00:00');
  const result = await h.query('2026-10-26');
  assert.equal(result.latest, '2026-10-26');
  assert.equal(result.samples.length, 1);
  assert.equal(result.samples[0].b25, 0);
});

test('complete-day query bounds rotate at Shanghai midnight across year and leap-day boundaries', async () => {
  const h = harness({ at: '2027-01-01T00:00:00' });
  const year = await h.query('2026-12-31');
  assert.equal(year.earliest, '2026-12-25');
  assert.equal(year.latest, '2026-12-31');
  await assert.rejects(h.query('2027-01-01'), /outside/);
  h.setTime('2028-03-01T00:00:00');
  const leap = await h.query('2028-02-29');
  assert.equal(leap.earliest, '2028-02-23');
  assert.equal(leap.latest, '2028-02-29');
  await assert.rejects(h.query('2028-02-22'), /outside/);
});

test('history paginates past 100 records and excludes internal database IDs', async () => {
  const h = harness();
  for (let minute = 0; minute < 1440; minute += 5) {
    h.records.set(String(minute), { _id: String(minute), date: '2026-10-25', minute, b25: minute, zhongmeng: 0 });
  }
  const history = await h.query('2026-10-25');
  assert.equal(history.samples.length, 288);
  assert.equal(history.samples[287].minute, 1435);
  assert.equal('_id' in history.samples[0], false);
});

test('cleanup runs on weekends, preserves the exact retention boundary, and never scans other collections', async () => {
  const h = harness({ at: '2026-10-25T00:05:00' });
  for (const date of ['2026-10-17', '2026-10-18', '2026-10-25']) {
    h.records.set(date, { _id: date, date });
  }
  const result = await h.handle(CLEANUP);
  assert.equal(result.cutoff, '2026-10-18');
  assert.equal(result.removed, 1);
  assert.equal(h.records.has('2026-10-18'), true);
  assert.equal(h.requests, 0);
  assert.equal(h.workdayChecks.length, 0);
  assert.equal((await h.handle(CLEANUP)).removed, 0);
});

test('cleanup is bounded to 500 deletions and resumes safely', async () => {
  const h = harness();
  for (let i = 0; i < 601; i++) h.records.set(String(i), { _id: String(i), date: '2026-10-01' });
  const first = await h.handle(CLEANUP);
  assert.equal(first.removed, 500);
  assert.equal(first.hasMore, true);
  assert.equal(h.records.size, 101);
  assert.equal((await h.handle(CLEANUP)).removed, 101);
});

test('configuration bounds cost and retains at least the prior same weekday', () => {
  for (const override of [
    { windows: [] }, { retentionDays: 7 }, { retentionDays: 32 },
    { calendar: { refreshHours: 0, maxStaleHours: 168 } },
  ]) assert.throws(() => validateConfig({ ...config, ...override }));
});

test('shared HTTP/HTTPS adapter bounds requests and rejects timeout, bad status and malformed JSON', async () => {
  const source = fs.readFileSync(path.join(__dirname, '../cloudfunctions/parkingHistory/http-json.js'), 'utf8');
  async function run(mode, protocol) {
    let requests = 0, deadline, cleared = false;
    const request = new EventEmitter();
    request.destroy = error => { request.emit('error', error); request.emit('close'); };
    const module = { exports: {} };
    vm.runInNewContext(source, {
      module, exports: module.exports, URL,
      setTimeout(fn, ms) { assert.equal(ms, 8000); deadline = fn; return 1; },
      clearTimeout() { cleared = true; },
      require(name) {
        assert.ok(['http', 'https'].includes(name));
        return { get(url, callback) {
          assert.equal(name, protocol);
          requests++;
          process.nextTick(() => {
            if (mode === 'timeout') { deadline(); return; }
            const response = new EventEmitter();
            response.statusCode = mode === 'status' ? 500 : 200;
            response.setEncoding = () => {};
            response.resume = () => {};
            callback(response);
            if (mode !== 'status') {
              response.emit('data', mode === 'json' ? '{invalid' : mode === 'large' ? 'x'.repeat(65537) :
                JSON.stringify({ msparkingData: [
                  { areaCode: 12, areaFreeSpaceNum: 0 }, { areaCode: 2, areaFreeSpaceNum: 20 },
                ] }));
              response.emit('end');
            }
            request.emit('close');
          });
          return request;
        } };
      },
    });
    if (mode === 'ok') assert.equal((await module.exports.getJson(`${protocol}://test.local/data`)).msparkingData[0].areaFreeSpaceNum, 0);
    else await assert.rejects(module.exports.getJson(`${protocol}://test.local/data`));
    assert.equal(requests, 1);
    assert.equal(cleared, true);
  }
  for (const protocol of ['http', 'https']) {
    for (const mode of ['ok', 'timeout', 'status', 'json', 'large']) await run(mode, protocol);
  }
});
