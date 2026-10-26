const { validateConfig } = require('./settings');
const { isDate } = require('./workdays');

const DAY = 86400000;
const OFFSET = 8 * 60 * 60 * 1000;
const COLLECTION = 'parking-history';
const COLLECT = 'parking-history-collect';
const CLEANUP = 'parking-history-cleanup';

function localTime(now) {
  const date = new Date(now + OFFSET);
  return {
    date: date.toISOString().slice(0, 10),
    weekday: date.getUTCDay(),
    minute: date.getUTCHours() * 60 + date.getUTCMinutes()
  };
}

function createHandler({ db, config, fetchSpaces, isWorkday, clock = Date.now }) {
  validateConfig(config);
  const collection = () => db.collection(COLLECTION);

  async function cleanup(now) {
    const cutoff = localTime(now - (config.retentionDays - 1) * DAY).date;
    let removed = 0;
    // Bound the work; oversized backlogs drain over subsequent daily runs.
    for (let batch = 0; batch < 5; batch++) {
      const { data } = await collection().where({ date: db.command.lt(cutoff) }).limit(100).get();
      if (!data.length) return { removed, cutoff, hasMore: false };
      await Promise.all(data.map(document => collection().doc(document._id).remove()));
      removed += data.length;
      if (data.length < 100) return { removed, cutoff, hasMore: false };
    }
    console.warn('Parking history cleanup reached its 500-document limit', { cutoff, removed });
    return { removed, cutoff, hasMore: true };
  }

  return async function handle(event = {}, identity = {}) {
    const now = clock();
    const current = localTime(now);
    if (event.Type === 'Timer') {
      // SOURCE is supplied by the SDK, never taken from the caller's event.
      if (identity.OPENID || identity.APPID || identity.UNIONID ||
          (identity.SOURCE && !['scf', 'timer'].includes(identity.SOURCE))) {
        throw new Error('Parking history timers cannot be invoked by clients');
      }
      if (event.TriggerName === CLEANUP) return cleanup(now);
      if (event.TriggerName !== COLLECT) throw new Error('Unknown parking history timer');
      const window = config.windows.find(item => current.minute >= item.startMinute &&
        current.minute <= item.endMinute && (current.minute - item.startMinute) % item.intervalMinutes === 0);
      if (!window) return { skipped: true, reason: 'outside-sampling-slot' };
      if (!await isWorkday(current.date)) {
        return { skipped: true, reason: 'non-workday' };
      }
      const spaces = await fetchSpaces();
      const minute = current.minute;
      const id = `${current.date}-${minute}`;
      await collection().doc(id).set({
        data: {
          date: current.date, minute, sampledAt: clock(), window: window.name,
          intervalMinutes: window.intervalMinutes,
          b25: spaces.b25, zhongmeng: spaces.zhongmeng
        }
      });
      return { recorded: true };
    }
    if (event.action !== 'history') throw new Error('Unknown parking history action');
    const date = event.data && event.data.date;
    const earliest = localTime(now - 7 * DAY).date;
    const latest = localTime(now - DAY).date;
    if (!isDate(date) || date < earliest || date > latest) {
      throw new Error('Date is outside the last seven complete days (today excluded)');
    }
    const samples = [];
    for (let offset = 0; offset < 300; offset += 100) {
      const { data } = await collection().where({ date }).orderBy('minute', 'asc')
        .skip(offset).limit(100).get();
      samples.push(...data.map(item => ({
        minute: item.minute, sampledAt: item.sampledAt, intervalMinutes: item.intervalMinutes, window: item.window,
        b25: item.b25, zhongmeng: item.zhongmeng
      })));
      if (data.length < 100) break;
    }
    return {
      date, today: current.date, earliest, latest,
      timezone: 'Asia/Shanghai',
      windows: config.windows,
      samples
    };
  };
}

module.exports = { createHandler, localTime, validateConfig };
