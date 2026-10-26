const DAY = 86400000;
const OFFSET = 8 * 60 * 60 * 1000;

function shanghaiDate(now) {
  return new Date(now + OFFSET).toISOString().slice(0, 10);
}

function daysBefore(date, days) {
  return new Date(Date.parse(date) - days * DAY).toISOString().slice(0, 10);
}

function timeLabel(minute) {
  return `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
}

function dayLabel(date, today) {
  const value = new Date(date);
  if (!Number.isFinite(value.getTime()) || value.toISOString().slice(0, 10) !== date) {
    throw new Error('Invalid parking review date');
  }
  const weekday = ['日', '一', '二', '三', '四', '五', '六'][value.getUTCDay()];
  const prefix = date === daysBefore(today, 1) ? '昨天 · ' : '';
  return `${prefix}${value.getUTCMonth() + 1}月${value.getUTCDate()}日 周${weekday}`;
}

function reviewRange(today) {
  dayLabel(today, today);
  const dates = [];
  for (let offset = 7; offset >= 1; offset--) {
    const date = daysBefore(today, offset);
    dates.push({ date, label: dayLabel(date, today) });
  }
  return { earliest: dates[0].date, latest: dates[6].date, dates };
}

function isReviewDate(date, range) {
  return typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    Number.isFinite(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date &&
    date >= range.earliest && date <= range.latest;
}

function chartMaximum(points) {
  const maximum = Math.max(0, ...points.map(point => point.value));
  if (maximum <= 20) return 20;
  const step = maximum <= 100 ? 20 : 100;
  return Math.ceil(maximum / step) * step;
}

function nearestObservation(period, minute) {
  let nearest = null;
  for (const point of period.points) {
    if (!nearest || Math.abs(point.minute - minute) < Math.abs(nearest.minute - minute)) nearest = point;
  }
  return nearest && Math.abs(nearest.minute - minute) <= nearest.intervalMinutes / 2 ? nearest : null;
}

function buildModel(history, lot) {
  if (!history || !Array.isArray(history.windows) || history.windows.length !== 2 ||
      !Array.isArray(history.samples) || !['b25', 'zhongmeng'].includes(lot)) {
    throw new Error('Invalid peak parking history');
  }
  const range = reviewRange(history.today);
  if (!isReviewDate(history.date, range)) {
    throw new Error('Parking review is limited to the previous seven complete days');
  }
  const windows = history.windows;
  windows.forEach((window, index) => {
    if (window.name !== ['morning', 'evening'][index] ||
        !Number.isInteger(window.startMinute) || !Number.isInteger(window.endMinute) ||
        window.startMinute < 0 || window.endMinute >= 1440 || window.endMinute <= window.startMinute ||
        !Number.isInteger(window.intervalMinutes) || window.intervalMinutes <= 0 ||
        (index > 0 && windows[index - 1].endMinute >= window.startMinute)) {
      throw new Error('Invalid peak parking windows');
    }
  });
  const seen = new Set();
  const points = history.samples.map(sample => {
    if (!Number.isInteger(sample.minute) || sample.minute < 0 || sample.minute >= 1440 ||
        !Number.isSafeInteger(sample[lot]) || sample[lot] < 0 ||
        !Number.isInteger(sample.intervalMinutes) || sample.intervalMinutes <= 0 ||
        seen.has(sample.minute)) {
      throw new Error('Invalid parking history sample');
    }
    seen.add(sample.minute);
    return {
      minute: sample.minute,
      value: sample[lot],
      intervalMinutes: sample.intervalMinutes,
    };
  }).sort((a, b) => a.minute - b.minute);
  const periods = windows.map(window => {
    const periodPoints = points.filter(point => point.minute >= window.startMinute && point.minute <= window.endMinute);
    periodPoints.forEach((point, index) => {
      const previous = periodPoints[index - 1];
      point.connectFromPrevious = Boolean(previous && point.minute - previous.minute === previous.intervalMinutes);
    });
    const minimum = periodPoints.reduce((result, point) => !result || point.value < result.value ? point : result, null);
    const last = periodPoints[periodPoints.length - 1];
    const intervals = [...new Set(periodPoints.map(point => point.intervalMinutes))];
    const interval = intervals.length === 1 ? intervals[0] : window.intervalMinutes;
    return {
      name: window.name,
      label: window.name === 'morning' ? '早高峰' : '晚高峰',
      startLabel: timeLabel(window.startMinute), endLabel: timeLabel(window.endMinute),
      start: window.startMinute,
      end: window.endMinute,
      cadenceLabel: intervals.length > 1 ? '间隔有调整' : `${interval}分钟 / 次`,
      hasPoints: periodPoints.length > 0,
      points: periodPoints,
      maximum: chartMaximum(periodPoints),
      sampleCount: periodPoints.length,
      minimumText: minimum ? String(minimum.value) : '—',
      minimumTime: minimum ? timeLabel(minimum.minute) : '',
      minimumTone: !minimum ? '' : minimum.value === 0 ? 'critical' : minimum.value <= 20 ? 'low' : '',
      lastText: last ? String(last.value) : '—',
      lastTime: last ? timeLabel(last.minute) : '',
      emptyTitle: '这个时段暂无记录',
      emptyDetail: '非工作日不采集，也可能尚未启用或采集失败',
      recordLabel: periodPoints.length ? `${periodPoints.length}次记录` : '尚无采样',
      inspection: '',
    };
  });
  const visibleCount = periods.reduce((sum, period) => sum + period.sampleCount, 0);
  return {
    periods, range,
    dateLabel: dayLabel(history.date, history.today),
    outsideWindowCount: points.length - visibleCount,
  };
}

module.exports = { shanghaiDate, daysBefore, timeLabel, dayLabel, reviewRange, isReviewDate, buildModel, nearestObservation };
