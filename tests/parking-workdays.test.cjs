const assert = require('node:assert/strict');
const test = require('node:test');
const { createWorkdayResolver, fetchCalendar, parseAnnualCalendar } = require('../cloudfunctions/parkingHistory/workdays');
const { calendar: settings } = require('../cloudfunctions/parkingHistory/config');
// Deliberate subset of published overrides; production always loads the complete annual dataset.
const fixture = require('./fixtures/parking-calendar-2026.json');
const HOUR = 3600000;
const now = Date.parse('2026-10-26T09:00:00+08:00');
const clone = value => JSON.parse(JSON.stringify(value));
const emptyNext = { year: 2027, papers: [], days: [] };
const flush = () => new Promise(setImmediate);

function harness(options = {}) {
  let clock = options.now || now, cache = options.cache && clone(options.cache);
  let requests = 0, reads = 0, writes = 0;
  const warnings = [];
  const db = { collection(name) {
    assert.equal(name, 'parking-calendar');
    return {
      where(query) {
        assert.deepEqual(query, { _id: 'china-workdays' });
        return { limit(limit) {
          assert.equal(limit, 1);
          return { async get() {
            reads++;
            if (options.readError) throw new Error('Cache read failed');
            return { data: cache ? [clone(cache)] : [] };
          } };
        } };
      },
      doc(id) {
        assert.equal(id, 'china-workdays');
        return { async set({ data }) {
          if (options.writeError) throw new Error('Cache write failed');
          writes++;
          cache = clone(data);
        } };
      },
    };
  } };
  const isWorkday = createWorkdayResolver({
    db, settings, clock: () => clock,
    logger: { warn(...args) { warnings.push(args); } },
    async loadCalendar(year) {
      requests++;
      if (options.loader) return options.loader(year, requests);
      if (options.failure) throw new Error('Calendar source down');
      return clone(fixture);
    },
  });
  return {
    isWorkday, warnings,
    advance(hours) { clock += hours * HOUR; },
    get requests() { return requests; }, get reads() { return reads; }, get writes() { return writes; },
    get cache() { return cache; },
  };
}

test('official holiday overrides and Saturday/Sunday makeup workdays take precedence over weekdays', async () => {
  const h = harness();
  assert.equal(await h.isWorkday('2026-10-01'), false); // Thursday, National Day
  assert.equal(await h.isWorkday('2026-10-10'), true); // Saturday makeup day
  assert.equal(await h.isWorkday('2026-01-04'), true); // Sunday makeup day
  assert.equal(await h.isWorkday('2026-10-24'), false);
  assert.equal(await h.isWorkday('2026-10-25'), false);
  assert.equal(await h.isWorkday('2026-10-26'), true);
  assert.equal(h.requests, 1);
  assert.equal(h.reads, 1);
  assert.equal(h.writes, 1);
});

test('calendar fetch validates both years and tolerates an unpublished next year without guessing that year', async () => {
  const requests = [];
  const result = await fetchCalendar(2026, async url => {
    requests.push(url);
    return url.endsWith('/2026.json') ? fixture : emptyNext;
  });
  assert.equal(result.year, 2026);
  assert.equal(result.days.find(day => day.date === '2026-10-10').isOffDay, false);
  assert.equal(requests.length, 2);
  assert.ok(requests.every(url => url.startsWith('https://')));
  await assert.rejects(fetchCalendar(2027, async url =>
    ({ year: Number(/(\d{4})\.json$/.exec(url)[1]), papers: [], days: [] })), /has not been published/);
});

test('following-year notices can change the current December, with newer overrides winning', async () => {
  const current = { ...fixture, days: [...fixture.days, { date: '2026-12-31', isOffDay: false }] };
  const next = {
    year: 2027, papers: fixture.papers,
    days: [{ date: '2027-01-01', isOffDay: true }, { date: '2026-12-31', isOffDay: true }],
  };
  const result = await fetchCalendar(2026, async url => url.endsWith('/2026.json') ? current : next);
  assert.equal(result.days.find(day => day.date === '2026-12-31').isOffDay, true);
  assert.equal(result.days.some(day => day.date.startsWith('2027-')), false);
});

test('calendar source uses its HTTPS mirror for transport or schema errors', async () => {
  const requests = [];
  const result = await fetchCalendar(2026, async url => {
    requests.push(url);
    if (url.includes('raw.githubusercontent.com')) {
      if (url.endsWith('/2026.json')) throw new Error('Timeout');
      return { unexpected: true };
    }
    return url.endsWith('/2026.json') ? fixture : emptyNext;
  });
  assert.equal(result.year, 2026);
  assert.equal(requests.length, 4);
});

test('only a confirmed next-year 404 counts as unpublished; source outages still surface', async () => {
  const unavailable = statusCode => async url => {
    if (url.endsWith('/2026.json')) return fixture;
    const error = new Error(`HTTP ${statusCode}`);
    error.statusCode = statusCode;
    throw error;
  };
  assert.equal((await fetchCalendar(2026, unavailable(404))).year, 2026);
  await assert.rejects(fetchCalendar(2026, unavailable(503)), /Cannot load workday calendar 2027/);
});

test('wrong years, missing notices, malformed dates and nonboolean or conflicting overrides are rejected', () => {
  assert.equal(parseAnnualCalendar(emptyNext, 2027, true), null);
  for (const invalid of [
    null, { ...fixture, year: 2025 }, { ...fixture, papers: [] },
    { ...fixture, papers: ['https://not-government.example/notice'] },
    { ...fixture, days: [] },
    { ...fixture, days: [{ date: '2026-02-30', isOffDay: true }] },
    { ...fixture, days: [{ date: '2026-10-01', isOffDay: 'false' }] },
    { ...fixture, days: [...fixture.days, { date: '2026-10-01', isOffDay: false }] },
  ]) assert.throws(() => parseAnnualCalendar(invalid, 2026));
});

test('cold function instances share a fresh database snapshot instead of calling the source per sample', async () => {
  const first = harness();
  await first.isWorkday('2026-10-26');
  const reopened = harness({ cache: first.cache, failure: true });
  assert.equal(await reopened.isWorkday('2026-10-26'), true);
  assert.equal(await reopened.isWorkday('2026-10-01'), false);
  assert.equal(reopened.requests, 0);
  assert.equal(reopened.reads, 1);
});

test('daily refresh automatically applies updated overrides without manual skipDates', async () => {
  const h = harness({
    cache: { ...fixture, refreshedAt: now - 24 * HOUR },
    loader: async () => ({
      ...fixture, days: [...fixture.days, { date: '2026-10-26', isOffDay: true }],
    }),
  });
  assert.equal(await h.isWorkday('2026-10-26'), false);
  assert.equal(h.requests, 1);
  assert.equal(h.cache.refreshedAt, now);
});

test('bounded stale calendar survives an outage with a warning and a shared one-hour retry backoff', async () => {
  const h = harness({ cache: { ...fixture, refreshedAt: now - 25 * HOUR }, failure: true });
  assert.equal(await h.isWorkday('2026-10-10'), true);
  assert.equal(h.warnings.length, 1);
  assert.match(h.warnings[0][0], /bounded stale cache/);
  assert.equal(h.requests, 1);
  await h.isWorkday('2026-10-26');
  assert.equal(h.requests, 1);
  const other = harness({ cache: h.cache, failure: true });
  await other.isWorkday('2026-10-26');
  assert.equal(other.requests, 0);
  h.advance(1);
  await h.isWorkday('2026-10-26');
  assert.equal(h.requests, 2);
});

test('an absent, too-old or previous-year calendar never silently degrades to Monday-Friday guesses', async () => {
  for (const cache of [
    undefined, { ...fixture, refreshedAt: now - 169 * HOUR },
    { ...fixture, year: 2025, refreshedAt: now },
  ]) {
    const h = harness({ cache, failure: true });
    await assert.rejects(h.isWorkday('2026-10-26'), /parking collection stopped/);
    assert.equal(h.requests, 1);
  }
});

test('retry backoff cannot extend stale data past the configured maximum age', async () => {
  const h = harness({ cache: { ...fixture, refreshedAt: now - 167.5 * HOUR }, failure: true });
  assert.equal(await h.isWorkday('2026-10-26'), true);
  h.advance(0.6);
  await assert.rejects(h.isWorkday('2026-10-26'), /parking collection stopped/);
  assert.equal(h.requests, 2);
});

test('cache corruption and cache storage failures are logged but do not hide a valid source calendar', async () => {
  for (const options of [
    { readError: true, writeError: true },
    { cache: { ...fixture, refreshedAt: now + HOUR } },
    { cache: { ...fixture, refreshedAt: now, days: [{ date: 'invalid', isOffDay: true }] } },
  ]) {
    const h = harness(options);
    assert.equal(await h.isWorkday('2026-10-01'), false);
    assert.equal(h.requests, 1);
    assert.ok(h.warnings.length > 0);
  }
});

test('concurrent workday decisions share a refresh and failed refreshes can be retried', async () => {
  let finish;
  const h = harness({ loader: () => new Promise(resolve => { finish = resolve; }) });
  const calls = [h.isWorkday('2026-10-26'), h.isWorkday('2026-10-01'), h.isWorkday('2026-10-10')];
  await flush();
  assert.equal(h.requests, 1);
  finish(fixture);
  assert.deepEqual(await Promise.all(calls), [true, false, true]);
  const failed = harness({ loader: async (year, attempt) => {
    if (attempt === 1) throw new Error('Temporary outage');
    return fixture;
  } });
  await assert.rejects(failed.isWorkday('2026-10-26'));
  assert.equal(await failed.isWorkday('2026-10-26'), true);
  assert.equal(failed.requests, 2);
});

test('new-year rollover replaces the one fixed cache document automatically', async () => {
  const h = harness({
    now: Date.parse('2027-01-04T09:00:00+08:00'),
    cache: { ...fixture, refreshedAt: now },
    loader: async year => ({
      year, papers: fixture.papers, days: [{ date: `${year}-01-01`, isOffDay: true }],
    }),
  });
  assert.equal(await h.isWorkday('2027-01-04'), true);
  assert.equal(h.cache.year, 2027);
  assert.equal(h.writes, 1);
});

test('invalid dates never call the calendar source or database', async () => {
  const h = harness();
  for (const date of ['2026-02-30', null, '2026-1-1', {}]) await assert.rejects(h.isWorkday(date));
  assert.equal(h.requests, 0);
  assert.equal(h.reads, 0);
});
