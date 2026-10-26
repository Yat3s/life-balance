const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const model = require('../miniprogram/pages/home/parkinghistory/model');
const root = path.resolve(__dirname, '..');
const now = Date.parse('2026-10-26T09:22:00+08:00');
const history = {
  date: '2026-10-19', today: '2026-10-26', earliest: '2026-10-19',
  windows: [
    { name: 'morning', startMinute: 450, endMinute: 630, intervalMinutes: 5 },
    { name: 'evening', startMinute: 990, endMinute: 1170, intervalMinutes: 10 },
  ],
  samples: [
    { minute: 540, b25: 20, zhongmeng: 50, intervalMinutes: 5 },
    { minute: 545, b25: 10, zhongmeng: 40, intervalMinutes: 5 },
    { minute: 555, b25: 0, zhongmeng: 30, intervalMinutes: 5 },
  ],
};
const flush = () => new Promise(setImmediate);

function harness(options = {}) {
  let definition;
  let width = options.width || 340;
  let clock = options.now || now;
  const requests = [], contexts = new Map(), creations = [], geometry = [], warnings = [], toasts = [];
  const source = fs.readFileSync(path.join(root,
    'miniprogram/pages/home/parkinghistory/parkinghistory.js'), 'utf8').replace(/^import .*;\r?\n/, '');
  class Clock extends Date { static now() { return clock; } }
  vm.runInNewContext(source, {
    require() { return model; }, Date: Clock,
    console: { error() {}, warn(...args) { warnings.push(args); } },
    fetchParkingHistory(date) {
      return new Promise((resolve, reject) => requests.push({ date, resolve, reject }));
    },
    Page(value) { definition = value; },
    wx: { showToast(options) { toasts.push(options); }, createCanvasContext(id) {
      creations.push(id);
      if (!contexts.has(id)) {
        const calls = [];
        contexts.set(id, { calls, ctx: new Proxy({}, {
          get(target, key) { return (...args) => { calls.push([key, ...args]); }; },
        }) });
      }
      return contexts.get(id).ctx;
    } },
  });
  const page = {
    ...definition,
    data: JSON.parse(JSON.stringify(definition.data)),
    setData(changes, callback) {
      for (const [key, value] of Object.entries(changes)) {
        const parts = key.replace(/\[(\d+)\]/g, '.$1').split('.');
        let target = this.data;
        for (const part of parts.slice(0, -1)) target = target[part];
        target[parts[parts.length - 1]] = value;
      }
      if (callback) callback();
    },
    createSelectorQuery() {
      const query = {
        select() { return query; },
        boundingClientRect(fn) {
          const rect = { left: 20, top: 40, width, height: 140 };
          if (options.deferGeometry) geometry.push(() => fn(rect));
          else fn(rect);
          return query;
        },
        exec() {},
      };
      return query;
    },
  };
  page.onLoad();
  if (!options.skipReady) page.onReady();
  return {
    page, requests, contexts, creations, warnings, toasts,
    setWidth(value) { width = value; },
    setNow(value) { clock = value; },
    flushGeometry() { while (geometry.length) geometry.shift()(); },
    resolve(index = 0, overrides = {}) {
      requests[index].resolve({ ...history, today: model.shanghaiDate(clock), date: requests[index].date, ...overrides });
    },
  };
}

test('peak review has two independent configured axes, never an all-day plot', () => {
  const result = model.buildModel(history, 'b25', now);
  assert.equal(result.periods.length, 2);
  const [morning, evening] = result.periods;
  assert.equal(morning.startLabel, '07:30');
  assert.equal(morning.endLabel, '10:30');
  assert.equal(evening.startLabel, '16:30');
  assert.equal(evening.endLabel, '19:30');
  assert.equal(morning.sampleCount, 3);
  assert.equal(evening.sampleCount, 0);
  assert.equal('start' in result, false);
  assert.equal('heatGroups' in result, false);
});

test('summaries come from actual observations, with real zeros distinct from no records', () => {
  const [morning, evening] = model.buildModel(history, 'b25', now).periods;
  assert.equal(morning.minimumText, '0');
  assert.equal(morning.minimumTime, '09:15');
  assert.equal(morning.minimumTone, 'critical');
  assert.equal(morning.lastText, '0');
  assert.equal(morning.lastTime, '09:15');
  assert.equal(morning.maximum, 20);
  assert.equal(evening.minimumText, '—');
  assert.equal(evening.lastText, '—');
  assert.equal(evening.hasPoints, false);
  assert.equal(morning.recordLabel, '3次记录');
  assert.equal(model.buildModel(history, 'zhongmeng', now).periods[0].minimumText, '30');
});

test('out-of-window legacy observations are counted explicitly but never drawn as midday data', () => {
  const result = model.buildModel({
    ...history,
    samples: [...history.samples, { minute: 810, b25: 100, zhongmeng: 80, intervalMinutes: 10 }],
  }, 'b25', now);
  assert.equal(result.outsideWindowCount, 1);
  assert.equal(result.periods[0].points.length, 3);
  assert.equal(result.periods[1].points.length, 0);
  assert.ok(result.periods.every(period => period.points.every(point =>
    point.minute >= period.start && point.minute <= period.end)));
});

test('recorded intervals, not assumed completeness percentages, describe historical cadence', () => {
  const singleCadence = model.buildModel({
    ...history, samples: history.samples.map(sample => ({ ...sample, intervalMinutes: 10 })),
  }, 'b25', now).periods[0];
  assert.equal(singleCadence.cadenceLabel, '10分钟 / 次');
  const mixed = model.buildModel({
    ...history, samples: [history.samples[0], { ...history.samples[1], intervalMinutes: 10 }],
  }, 'b25', now).periods[0];
  assert.equal(mixed.cadenceLabel, '间隔有调整');
  assert.equal('coverage' in mixed, false);
});

test('missing samples are not connected or interpolated, and inspection reports only nearby real observations', () => {
  const period = model.buildModel(history, 'b25', now).periods[0];
  assert.equal(period.points[0].connectFromPrevious, false);
  assert.equal(period.points[1].connectFromPrevious, true);
  assert.equal(period.points[2].connectFromPrevious, false);
  assert.equal(model.nearestObservation(period, 550), null);
  assert.equal(model.nearestObservation(period, 545.5).value, 10);
  assert.equal(model.nearestObservation({ points: [] }, 540), null);
});

test('window endpoints remain included and even adjacent periods can never share a line segment', () => {
  const result = model.buildModel({
    ...history,
    windows: [
      { name: 'morning', startMinute: 450, endMinute: 455, intervalMinutes: 5 },
      { name: 'evening', startMinute: 460, endMinute: 470, intervalMinutes: 10 },
    ],
    samples: [
      { minute: 455, b25: 1, zhongmeng: 2, intervalMinutes: 5 },
      { minute: 460, b25: 3, zhongmeng: 4, intervalMinutes: 10 },
      { minute: 470, b25: 4, zhongmeng: 5, intervalMinutes: 10 },
    ],
  }, 'b25', now);
  assert.equal(result.periods[0].points.length, 1);
  assert.equal(result.periods[1].points.length, 2);
  assert.equal(result.periods[1].points[0].connectFromPrevious, false);
  assert.equal(result.periods[1].points[1].connectFromPrevious, true);
});

test('only completed historical days are accepted and empty periods never become zero values', () => {
  assert.throws(() => model.buildModel({ ...history, date: '2026-10-26' }, 'b25', now), /previous seven complete days/);
  assert.throws(() => model.buildModel({ ...history, date: '2026-10-18' }, 'b25', now), /previous seven complete days/);
  assert.doesNotMatch(model.buildModel(history, 'b25', now).periods[0].recordLabel, /采集中|完整|覆盖率/);
  assert.equal(model.buildModel(history, 'b25', now).periods[1].minimumText, '—');
  assert.equal(model.buildModel({ ...history, samples: [] }, 'b25', now).periods[0].emptyTitle, '这个时段暂无记录');
});

test('date wording and the prior same weekday use Shanghai dates rather than the computer timezone', () => {
  assert.equal(model.shanghaiDate(Date.parse('2026-10-25T17:00:00Z')), '2026-10-26');
  assert.equal(model.daysBefore('2026-10-26', 7), '2026-10-19');
  assert.equal(model.dayLabel('2026-10-25', '2026-10-26'), '昨天 · 10月25日 周日');
  assert.equal(model.dayLabel('2026-10-19', '2026-10-26'), '10月19日 周一');
  assert.throws(() => model.dayLabel('2026-02-30', '2026-10-26'));
  const range = model.reviewRange('2026-10-26');
  assert.equal(range.dates.length, 7);
  assert.equal(range.earliest, '2026-10-19');
  assert.equal(range.latest, '2026-10-25');
  assert.equal(range.dates.some(choice => choice.date === '2026-10-26'), false);
  assert.equal(model.isReviewDate('2026-10-18', range), false);
  assert.equal(model.isReviewDate('2026-10-26', range), false);
  assert.equal(model.reviewRange('2028-03-01').latest, '2028-02-29');
});

test('malformed, duplicate or invalid-window responses fail instead of creating plausible-looking graphics', () => {
  for (const invalid of [
    { minute: 540, b25: null, intervalMinutes: 5 },
    { minute: 540, b25: 0 },
    { minute: -1, b25: 0, intervalMinutes: 5 },
  ]) assert.throws(() => model.buildModel({ ...history, samples: [invalid] }, 'b25', now));
  assert.throws(() => model.buildModel({ ...history, samples: [history.samples[0], history.samples[0]] }, 'b25', now));
  assert.throws(() => model.buildModel({ ...history, windows: [] }, 'b25', now));
  assert.throws(() => model.buildModel(history, 'unknown', now));
  assert.throws(() => model.buildModel({
    ...history, windows: [history.windows[0], { ...history.windows[1], startMinute: 630 }],
  }, 'b25', now));
});

test('date and lot controls change the review without fetching separately for each peak', async () => {
  const h = harness();
  assert.equal(h.requests[0].date, '2026-10-25');
  assert.equal(h.page.data.reviewDates.length, 7);
  h.resolve();
  await flush();
  assert.equal(h.page.data.periods[0].minimumText, '0');
  assert.ok(h.contexts.has('chart-morning'));
  assert.equal(h.contexts.has('chart-evening'), false);
  assert.equal(h.contexts.has('history-chart'), false);
  h.page.onLotChange({ currentTarget: { dataset: { lot: 'zhongmeng' } } });
  assert.equal(h.page.data.periods[0].minimumText, '30');
  assert.equal(h.requests.length, 1);
  h.page.onRangeShortcut();
  assert.equal(h.requests[1].date, '2026-10-19');
  h.resolve(1);
  await flush();
  assert.equal(h.page.data.quickDateLabel, '回到昨天');
  h.page.onRangeShortcut();
  assert.equal(h.requests[2].date, '2026-10-25');
});

test('the date selector offers only seven completed days and rejects invalid or tampered choices before networking', async () => {
  const h = harness();
  h.resolve(0, { earliest: '2000-01-01', latest: '2026-10-26' });
  await flush();
  assert.equal(h.page.data.earliest, '2026-10-19');
  assert.equal(h.page.data.latest, '2026-10-25');
  assert.equal(h.page.data.reviewDates.length, 7);
  for (const value of [7, -1, 0.5, null, '', '2026-10-26', '2026-10-18']) {
    h.page.onDateChange({ detail: { value } });
  }
  assert.equal(h.requests.length, 1);
  assert.equal(h.toasts.length, 7);
  assert.equal(h.page.data.date, '2026-10-25');
  h.page.data.date = '2026-10-26';
  h.page.loadHistory();
  assert.equal(h.requests.length, 1);
  assert.match(h.page.data.error, /不含今天/);
  assert.equal(h.page._history, null);
});

test('returning after Shanghai midnight drops an expired date and defaults to the new yesterday', async () => {
  const h = harness();
  h.resolve();
  await flush();
  h.page.onRangeShortcut();
  h.resolve(1);
  await flush();
  assert.equal(h.page.data.date, '2026-10-19');
  h.setNow(Date.parse('2026-10-27T00:00:00+08:00'));
  h.page.onShow();
  assert.equal(h.requests[2].date, '2026-10-26');
  h.resolve(2);
  await flush();
  assert.equal(h.page.data.latest, '2026-10-26');
  assert.equal(h.page.data.earliest, '2026-10-20');
  assert.equal(h.page.data.dateLabel, '昨天 · 10月26日 周一');
  assert.equal(h.page.data.reviewDates.some(choice => choice.date === '2026-10-27'), false);
});

test('a response crossing midnight cannot render a date that just expired from the seven-day window', async () => {
  const h = harness();
  h.resolve();
  await flush();
  h.page.onRangeShortcut();
  assert.equal(h.requests[1].date, '2026-10-19');
  h.setNow(Date.parse('2026-10-27T00:00:00+08:00'));
  h.resolve(1, { today: '2026-10-26' });
  await flush();
  assert.equal(h.requests[2].date, '2026-10-26');
  assert.equal(h.page.data.periods.length, 0);
  h.resolve(2);
  await flush();
  assert.equal(h.page.data.date, '2026-10-26');
  assert.equal(h.page.data.earliest, '2026-10-20');
});

test('touch inspection uses each peak axis and does not invent values inside a sampling gap', async () => {
  const h = harness();
  h.resolve();
  await flush();
  const localX = minute => 30 + (minute - 450) / 180 * (340 - 8 - 30);
  h.page.onChartTouch({
    currentTarget: { dataset: { period: 'morning' } }, touches: [{ x: localX(545) }],
  });
  assert.equal(h.page.data.periods[0].inspection, '09:05 · 10 个余位');
  h.page.onChartTouch({
    currentTarget: { dataset: { period: 'morning' } }, touches: [{ clientX: 20 + localX(550) }],
  });
  assert.equal(h.page.data.periods[0].inspection, '09:10 附近无采样');
  assert.equal(h.page.data.periods[0].minimumText, '0');
  h.page.onChartTouch({ currentTarget: { dataset: { period: 'morning' } }, touches: [{}] });
  assert.equal(h.warnings.length, 1);
});

test('each peak renders its own canvas and remains within the chart at phone widths', async () => {
  for (const width of [280, 335, 374]) {
    const h = harness({ width });
    h.resolve(0, { samples: [
      ...history.samples, { minute: 990, b25: 40, zhongmeng: 20, intervalMinutes: 10 },
      { minute: 1170, b25: 300, zhongmeng: 150, intervalMinutes: 10 },
    ] });
    await flush();
    assert.ok(h.contexts.has('chart-morning'));
    assert.ok(h.contexts.has('chart-evening'));
    for (const context of h.contexts.values()) {
      for (const call of context.calls.filter(call => call[0] === 'arc')) {
        assert.ok(call[1] >= 30 && call[1] <= width - 8);
        assert.ok(call[2] >= 12 && call[2] <= 114);
      }
    }
    h.setWidth(width + 10);
    h.page.onResize();
    assert.equal(h.requests.length, 1);
  }
});

test('out-of-order responses and destroyed pages cannot overwrite the selected review', async () => {
  const h = harness();
  h.page.onDateChange({ detail: { value: '1' } });
  h.resolve(1, { samples: [] });
  await flush();
  h.resolve(0);
  await flush();
  assert.equal(h.page.data.date, '2026-10-20');
  assert.equal(h.page.data.periods[0].hasPoints, false);
  h.page.loadHistory();
  h.page.onUnload();
  h.resolve(2);
  await flush();
  assert.equal(h.page.data.periods.length, 0);
});

test('old asynchronous chart measurements cannot repaint after lot changes or page teardown', async () => {
  const h = harness({ deferGeometry: true });
  h.resolve();
  await flush();
  h.page.onLotChange({ currentTarget: { dataset: { lot: 'zhongmeng' } } });
  h.flushGeometry();
  assert.equal(h.creations.length, 1);
  const closed = harness({ deferGeometry: true });
  closed.resolve();
  await flush();
  closed.page.onUnload();
  closed.flushGeometry();
  assert.equal(closed.creations.length, 0);
});

test('rendered data paints without a stale readiness flag and returning to the page redraws both charts', async () => {
  const h = harness({ skipReady: true });
  h.resolve();
  await flush();
  assert.equal(h.creations.length, 1);
  h.page.onShow();
  h.page.onReady();
  assert.equal(h.creations.length, 3);
  assert.equal(h.requests.length, 1);
});

test('empty data keeps both peak cards, while failed or invalid data shows retry rather than an empty-day claim', async () => {
  const h = harness();
  h.requests[0].reject(new Error('Function unavailable'));
  await flush();
  assert.match(h.page.data.error, /加载失败/);
  assert.equal(h.page.data.periods.length, 0);
  h.page.loadHistory();
  h.resolve(1, { samples: [] });
  await flush();
  assert.equal(h.page.data.error, '');
  assert.equal(h.page.data.periods.length, 2);
  assert.equal(h.page.data.periods[0].minimumText, '—');
  h.page.loadHistory();
  h.resolve(2, { samples: [{ minute: 540, b25: 'bad', intervalMinutes: 5 }] });
  await flush();
  assert.match(h.page.data.error, /加载失败/);
  assert.equal(h.page._history, null);
  assert.doesNotThrow(() => h.page.onLotChange({ currentTarget: { dataset: { lot: 'zhongmeng' } } }));
});

test('entry wording promises peak-only review, while the original widgets retain their existing behavior', () => {
  for (const widget of ['commute', 'commuteV2']) {
    const wxml = fs.readFileSync(path.join(root, `miniprogram/components/${widget}/${widget}.wxml`), 'utf8');
    assert.match(wxml, /catchtap="toParkingHistory"/);
    assert.match(wxml, /早晚高峰车位回顾/);
    const source = fs.readFileSync(path.join(root, `miniprogram/components/${widget}/${widget}.js`), 'utf8');
    assert.match(source, /toParkingHistory\(\)\s*{\s*navigateToParkingHistory\(\)/);
    assert.match(source, /recordParkingFull/);
    assert.match(source, /fetchLastWeekParkingFullTime/);
  }
  const app = JSON.parse(fs.readFileSync(path.join(root, 'miniprogram/app.json'), 'utf8'));
  assert.ok(app.pages.includes('pages/home/parkinghistory/parkinghistory'));
  const wxml = fs.readFileSync(path.join(root, 'miniprogram/pages/home/parkinghistory/parkinghistory.wxml'), 'utf8');
  assert.match(wxml, /高峰车位回顾/);
  assert.match(wxml, /不是全天/);
  assert.match(wxml, /不含今天/);
  assert.match(wxml, /mode="selector"/);
  assert.match(wxml, /range="{{reviewDates}}"/);
  assert.doesNotMatch(wxml, /mode="date"/);
  assert.match(wxml, /记录不代表实时余位/);
  assert.doesNotMatch(wxml, /heat-strip|history-chart|余量热力条/);
  const stack = [];
  for (const tag of wxml.match(/<\/?[a-z][^>]*>/gi)) {
    const name = /^<\/?([a-z][\w-]*)/i.exec(tag)[1];
    if (tag.startsWith('</')) assert.equal(stack.pop(), name, tag);
    else if (!tag.endsWith('/>')) stack.push(name);
  }
  assert.deepEqual(stack, []);
});
