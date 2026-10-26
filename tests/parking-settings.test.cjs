const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { parseConfig, validateConfig } = require('../cloudfunctions/parkingHistory/settings');

const text = fs.readFileSync(path.join(__dirname,
  '../cloudfunctions/parkingHistory/parking-history.ini'), 'utf8');
const config = require('../cloudfunctions/parkingHistory/config');

test('INI is the single source of independently configurable morning and evening schedules', () => {
  assert.deepEqual(parseConfig(text), config);
  assert.deepEqual(config.windows, [
    { name: 'morning', startMinute: 450, endMinute: 630, intervalMinutes: 5 },
    { name: 'evening', startMinute: 990, endMinute: 1170, intervalMinutes: 10 },
  ]);
  assert.deepEqual(config.calendar, { refreshHours: 24, maxStaleHours: 168 });
  assert.equal(config.retentionDays, 8);
  assert.equal('skipDates' in config, false);
  assert.deepEqual(parseConfig('\uFEFF' + text.replace(/\n/g, '\r\n') + '\r\n# comment'), config);
});

test('both windows can be changed separately without editing handler code', () => {
  const changed = parseConfig(text.replace('07:30', '07:35').replace('10:30', '10:35')
    .replace('interval_minutes = 5', 'interval_minutes = 15'));
  assert.equal(changed.windows[0].startMinute, 455);
  assert.equal(changed.windows[0].endMinute, 635);
  assert.equal(changed.windows[0].intervalMinutes, 15);
  assert.deepEqual(changed.windows[1], config.windows[1]);
});

test('invalid, overlapping, ambiguous or unsupported settings fail loudly', () => {
  for (const invalid of [
    text.replace('[morning]', '[missing]'),
    text.replace('start = 07:30', 'start = 07:30\nstart = 08:00'),
    text + '\n[morning]\n',
    text + '\nskip_dates = 2026-10-01\n',
    text.replace('07:30', '7:30'),
    text.replace('07:30', '07:31'),
    text.replace('10:30', '24:00'),
    text.replace('interval_minutes = 5', 'interval_minutes = 7'),
    text.replace('interval_minutes = 5', 'interval_minutes = 0'),
    text.replace('interval_minutes = 5', 'interval_minutes = 1e2'),
    text.replace('end = 10:30', 'end = 16:30'),
    text.replace('end = 10:30', 'end = 07:30'),
    text.replace('end = 19:30', 'end = 19:25'),
    text.replace('retention_days = 8', 'retention_days = 7'),
    text.replace('retention_days = 8', 'retention_days = 32'),
    text.replace('refresh_hours = 24', 'refresh_hours = 0'),
    text.replace('max_stale_hours = 168', 'max_stale_hours = 12'),
    text.replace('max_stale_hours = 168', 'max_stale_hours = 745'),
  ]) assert.throws(() => parseConfig(invalid));
  assert.throws(() => validateConfig({ ...config, windows: [config.windows[0]] }));
});

test('deployed base timer can reach every configured five-minute morning and ten-minute evening slot', () => {
  const triggers = require('../cloudfunctions/parkingHistory/config.json').triggers;
  assert.equal(triggers.find(trigger => trigger.name === 'parking-history-collect').config, '0 */5 * * * * *');
  assert.equal(triggers.find(trigger => trigger.name === 'parking-history-cleanup').config, '0 5 0 * * * *');
});
