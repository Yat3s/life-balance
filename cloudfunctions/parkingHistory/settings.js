const SECTIONS = {
  morning: ['start', 'end', 'interval_minutes'],
  evening: ['start', 'end', 'interval_minutes'],
  storage: ['retention_days'],
  calendar: ['refresh_hours', 'max_stale_hours'],
};

function validateConfig(config) {
  if (!Array.isArray(config.windows) || config.windows.length !== 2 ||
      !Number.isInteger(config.retentionDays) || config.retentionDays < 8 || config.retentionDays > 31 ||
      !config.calendar || !Number.isInteger(config.calendar.refreshHours) ||
      config.calendar.refreshHours < 1 || config.calendar.refreshHours > 168 ||
      !Number.isInteger(config.calendar.maxStaleHours) ||
      config.calendar.maxStaleHours < config.calendar.refreshHours || config.calendar.maxStaleHours > 744) {
    throw new Error('Invalid parking history configuration');
  }
  config.windows.forEach((window, index) => {
    if (window.name !== ['morning', 'evening'][index] ||
        !Number.isInteger(window.startMinute) || !Number.isInteger(window.endMinute) ||
        window.startMinute < 0 || window.endMinute >= 1440 || window.startMinute >= window.endMinute ||
        window.startMinute % 5 !== 0 || window.endMinute % 5 !== 0 ||
        ![5, 10, 15, 20, 30, 60].includes(window.intervalMinutes) ||
        (window.endMinute - window.startMinute) % window.intervalMinutes !== 0 ||
        (index > 0 && config.windows[index - 1].endMinute >= window.startMinute)) {
      throw new Error('Invalid or overlapping parking sampling windows');
    }
  });
}

function parseConfig(text) {
  const sections = {};
  let current;
  for (const [index, raw] of text.replace(/^\uFEFF/, '').split(/\r?\n/).entries()) {
    const line = raw.trim().replace(/[;#].*$/, '').trim();
    if (!line) continue;
    const section = /^\[([a-z]+)\]$/.exec(line);
    if (section && SECTIONS[section[1]] && !sections[section[1]]) {
      current = section[1];
      sections[current] = {};
      continue;
    }
    const pair = /^([a-z_]+)\s*=\s*(\S+)$/.exec(line);
    if (!pair || !current || !SECTIONS[current].includes(pair[1]) ||
        Object.prototype.hasOwnProperty.call(sections[current], pair[1])) {
      throw new Error(`Invalid parking-history.ini line ${index + 1}`);
    }
    sections[current][pair[1]] = pair[2];
  }
  for (const [name, keys] of Object.entries(SECTIONS)) {
    if (!sections[name] || keys.some(key => !Object.prototype.hasOwnProperty.call(sections[name], key))) {
      throw new Error(`Missing parking-history.ini settings in [${name}]`);
    }
  }
  const minute = value => {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) throw new Error(`Invalid sampling time: ${value}`);
    const [hour, minutes] = value.split(':').map(Number);
    return hour * 60 + minutes;
  };
  const integer = value => /^\d+$/.test(value) ? Number(value) : NaN;
  const config = {
    windows: ['morning', 'evening'].map(name => ({
      name,
      startMinute: minute(sections[name].start),
      endMinute: minute(sections[name].end),
      intervalMinutes: integer(sections[name].interval_minutes),
    })),
    retentionDays: integer(sections.storage.retention_days),
    calendar: {
      refreshHours: integer(sections.calendar.refresh_hours),
      maxStaleHours: integer(sections.calendar.max_stale_hours),
    },
  };
  validateConfig(config);
  return config;
}

module.exports = { parseConfig, validateConfig };
