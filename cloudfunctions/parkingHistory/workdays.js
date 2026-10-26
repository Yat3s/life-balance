const { getJson } = require('./http-json');

const HOUR = 3600000;
const CACHE_COLLECTION = 'parking-calendar';
const CACHE_ID = 'china-workdays';
const SOURCES = [
  'https://raw.githubusercontent.com/NateScarlet/holiday-cn/master',
  'https://cdn.jsdelivr.net/gh/NateScarlet/holiday-cn@master',
];

function isDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}

function parseAnnualCalendar(body, year, optional = false) {
  if (!body || body.year !== year || !Array.isArray(body.papers) || !Array.isArray(body.days)) {
    throw new Error(`Invalid workday calendar for ${year}`);
  }
  if (optional && !body.papers.length && !body.days.length) return null;
  if (!body.papers.length || !body.days.some(day => day && typeof day.date === 'string' &&
      day.date.startsWith(`${year}-`))) {
    throw new Error(`Workday calendar for ${year} has not been published`);
  }
  for (const paper of body.papers) {
    const url = new URL(paper);
    if (!['http:', 'https:'].includes(url.protocol) ||
        !(url.hostname === 'gov.cn' || url.hostname.endsWith('.gov.cn'))) {
      throw new Error(`Workday calendar for ${year} has no valid government notice`);
    }
  }
  const days = new Map();
  for (const day of body.days) {
    if (!day || !isDate(day.date) || typeof day.isOffDay !== 'boolean' ||
        (days.has(day.date) && days.get(day.date).isOffDay !== day.isOffDay)) {
      throw new Error(`Invalid or conflicting workday override for ${year}`);
    }
    days.set(day.date, { date: day.date, isOffDay: day.isOffDay });
  }
  return { year, papers: body.papers, days: [...days.values()] };
}

async function fetchCalendar(year, request = getJson) {
  async function fetchYear(target, optional) {
    const failures = [];
    for (const source of SOURCES) {
      try {
        return parseAnnualCalendar(await request(`${source}/${target}.json`), target, optional);
      } catch (error) {
        failures.push(error);
      }
    }
    if (optional && failures.every(error => error.statusCode === 404)) return null;
    throw new Error(`Cannot load workday calendar ${target}: ${failures.map(error => error.message).join('; ')}`);
  }
  // A following year's official notice may override dates in the current December.
  const [current, next] = await Promise.all([fetchYear(year, false), fetchYear(year + 1, true)]);
  const days = new Map();
  for (const calendar of [current, next].filter(Boolean)) {
    for (const day of calendar.days) {
      if (day.date.startsWith(`${year}-`)) days.set(day.date, day);
    }
  }
  return {
    year,
    papers: [...new Set([...current.papers, ...(next ? next.papers : [])])],
    days: [...days.values()].sort((a, b) => a.date.localeCompare(b.date)),
  };
}

function createWorkdayResolver({ db, settings, loadCalendar = fetchCalendar, clock = Date.now, logger = console }) {
  let memory;
  let pending;
  const age = (calendar, now) => now - calendar.refreshedAt;
  const usable = (calendar, now) => calendar && age(calendar, now) >= 0 &&
    age(calendar, now) <= settings.maxStaleHours * HOUR;
  const ready = (calendar, now) => usable(calendar, now) &&
    (age(calendar, now) < settings.refreshHours * HOUR || calendar.retryAfter > now);

  async function persist(calendar) {
    try {
      await db.collection(CACHE_COLLECTION).doc(CACHE_ID).set({ data: calendar });
    } catch (error) {
      logger.warn('Failed to persist workday calendar; using validated in-memory data', error);
    }
  }

  async function refresh(year) {
    const now = clock();
    let cached = memory && memory.year === year ? memory : null;
    try {
      const { data } = await db.collection(CACHE_COLLECTION).where({ _id: CACHE_ID }).limit(1).get();
      if (data[0] && data[0].year === year) {
        const parsed = parseAnnualCalendar(data[0], year);
        if (!Number.isFinite(data[0].refreshedAt) || data[0].refreshedAt > now) {
          throw new Error('Invalid workday calendar cache timestamp');
        }
        if (!cached || data[0].refreshedAt > cached.refreshedAt) {
          cached = {
            ...parsed, refreshedAt: data[0].refreshedAt,
            retryAfter: Number.isFinite(data[0].retryAfter) ? Math.min(data[0].retryAfter, now + HOUR) : 0,
          };
        }
      }
    } catch (error) {
      logger.warn('Cannot read workday calendar cache; attempting calendar refresh', error);
    }
    if (ready(cached, now)) {
      memory = cached;
      return cached;
    }
    try {
      const parsed = parseAnnualCalendar(await loadCalendar(year), year);
      memory = { ...parsed, refreshedAt: clock(), retryAfter: 0 };
      await persist(memory);
      return memory;
    } catch (error) {
      if (!usable(cached, clock())) {
        throw new Error(`Workday calendar unavailable for ${year}; parking collection stopped: ${error.message}`);
      }
      logger.warn('Workday calendar refresh failed; using bounded stale cache', {
        year, ageHours: age(cached, clock()) / HOUR, error: error.message,
      });
      memory = { ...cached, retryAfter: clock() + HOUR };
      await persist(memory);
      return memory;
    }
  }

  return async function isWorkday(date) {
    if (!isDate(date)) throw new Error('Invalid workday date');
    const year = Number(date.slice(0, 4));
    let calendar;
    if (memory && memory.year === year && ready(memory, clock())) {
      calendar = memory;
    } else {
      if (!pending || pending.year !== year) {
        pending = { year, promise: refresh(year) };
      }
      const current = pending;
      try {
        calendar = await current.promise;
      } finally {
        if (pending === current) pending = null;
      }
    }
    const override = calendar.days.find(day => day.date === date);
    if (override) return !override.isOffDay;
    const weekday = new Date(date).getUTCDay();
    return weekday !== 0 && weekday !== 6;
  };
}

module.exports = { createWorkdayResolver, fetchCalendar, parseAnnualCalendar, isDate };
