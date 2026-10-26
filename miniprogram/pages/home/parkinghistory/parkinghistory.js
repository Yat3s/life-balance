import { fetchParkingHistory } from '../../../repository/dashboardRepo';
const { shanghaiDate, timeLabel, dayLabel, reviewRange, isReviewDate, buildModel, nearestObservation } = require('./model');

Page({
  data: {
    lot: 'b25',
    date: '',
    today: '',
    earliest: '',
    latest: '',
    reviewDates: [],
    dateIndex: 6,
    loading: true,
    error: '',
    dateLabel: '',
    quickDateLabel: '7天前',
    periods: [],
    outsideWindowCount: 0,
  },

  onLoad() {
    this._requestId = 0;
    this._unloaded = false;
    this._chartRects = {};
    this._selection = {};
    const today = shanghaiDate(Date.now());
    const range = reviewRange(today);
    this.setData({
      today, earliest: range.earliest, latest: range.latest, reviewDates: range.dates,
      date: range.latest, dateLabel: dayLabel(range.latest, today),
    });
    this.loadHistory();
  },

  onReady() {
    this.drawCharts();
  },

  onShow() {
    const today = shanghaiDate(Date.now());
    if (this.data.today && this.data.today !== today) {
      const range = reviewRange(today);
      this.setData({ date: isReviewDate(this.data.date, range) ? this.data.date : range.latest });
      this.loadHistory();
      return;
    }
    this.drawCharts();
  },

  onResize() {
    this.drawCharts();
  },

  onUnload() {
    this._unloaded = true;
    this._requestId++;
    this._chartRects = {};
  },

  onDateChange(event) {
    const raw = event.detail.value;
    const index = typeof raw === 'number' ? raw : typeof raw === 'string' && /^[0-6]$/.test(raw) ? Number(raw) : NaN;
    const choice = this.data.reviewDates[index];
    if (!Number.isInteger(index) || !choice || !isReviewDate(choice.date, reviewRange(shanghaiDate(Date.now())))) {
      console.warn('Rejected out-of-range parking review date selection');
      wx.showToast({ icon: 'none', title: '仅能查看过去7天，不含今天' });
      return;
    }
    this.setData({ date: choice.date, dateIndex: index });
    this.loadHistory();
  },

  onRangeShortcut() {
    const today = shanghaiDate(Date.now());
    const range = reviewRange(today);
    this.setData({ date: this.data.date === range.earliest ? range.latest : range.earliest });
    this.loadHistory();
  },

  onLotChange(event) {
    const lot = event.currentTarget.dataset.lot;
    if (!['b25', 'zhongmeng'].includes(lot)) return;
    this.setData({ lot });
    if (this._history) this.renderHistory();
  },

  onChartTouch(event) {
    const name = event.currentTarget.dataset.period;
    const layout = this._chartRects[name];
    if (!layout || !this._model || this._unloaded) return;
    const index = this._model.periods.findIndex(period => period.name === name);
    const period = this._model.periods[index];
    const touch = event.touches && event.touches[0];
    if (!touch) return;
    const localX = Number.isFinite(touch.x) ? touch.x : touch.clientX - layout.rect.left;
    if (!Number.isFinite(localX)) {
      console.warn('Cannot inspect peak parking chart: invalid touch coordinates');
      return;
    }
    const ratio = Math.max(0, Math.min(1, (localX - layout.left) / (layout.right - layout.left)));
    const minute = period.start + ratio * (period.end - period.start);
    const point = nearestObservation(period, minute);
    this._selection[name] = point;
    const inspection = point ? `${timeLabel(point.minute)} · ${point.value} 个余位` :
      `${timeLabel(Math.round(minute))} 附近无采样`;
    this.setData({ [`periods[${index}].inspection`]: inspection });
    this.paintChart(period, layout, point);
  },

  loadHistory() {
    const requestId = ++this._requestId;
    this._history = null;
    this._model = null;
    this._chartRects = {};
    const today = shanghaiDate(Date.now());
    const range = reviewRange(today);
    if (!isReviewDate(this.data.date, range)) {
      console.error('Rejected parking history request outside the previous seven complete days');
      this.setData({
        today, earliest: range.earliest, latest: range.latest, reviewDates: range.dates,
        loading: false, periods: [], outsideWindowCount: 0, error: '仅能查看过去7个完整自然日，不含今天。',
      });
      return;
    }
    this.setData({
      loading: true, error: '', periods: [], outsideWindowCount: 0,
      today, earliest: range.earliest, latest: range.latest, reviewDates: range.dates,
      dateIndex: range.dates.findIndex(choice => choice.date === this.data.date),
      dateLabel: dayLabel(this.data.date, today),
      quickDateLabel: this.data.date === range.earliest ? '回到昨天' : '7天前',
    });
    return fetchParkingHistory(this.data.date).then(history => {
      if (this._unloaded || requestId !== this._requestId) return;
      const currentToday = shanghaiDate(Date.now());
      if (currentToday !== today) {
        const currentRange = reviewRange(currentToday);
        this.setData({ date: isReviewDate(this.data.date, currentRange) ? this.data.date : currentRange.latest });
        return this.loadHistory();
      }
      this._history = history;
      this.setData({ today: history.today, loading: false });
      this.renderHistory();
    }).catch(error => {
      if (this._unloaded || requestId !== this._requestId) return;
      console.error('Failed to fetch parking history', error);
      this._history = null;
      this._model = null;
      this._chartRects = {};
      this.setData({ loading: false, error: '高峰记录加载失败，请重试。' });
    });
  },

  renderHistory() {
    this._model = buildModel(this._history, this.data.lot);
    this._chartRects = {};
    this._selection = {};
    const model = this._model;
    this.setData({
      periods: model.periods,
      earliest: model.range.earliest,
      latest: model.range.latest,
      reviewDates: model.range.dates,
      dateIndex: model.range.dates.findIndex(choice => choice.date === this.data.date),
      dateLabel: model.dateLabel,
      outsideWindowCount: model.outsideWindowCount,
      quickDateLabel: this.data.date === model.range.earliest ? '回到昨天' : '7天前',
    }, () => this.drawCharts());
  },

  drawCharts() {
    if (this._unloaded || !this._model) return;
    const model = this._model;
    model.periods.filter(period => period.hasPoints).forEach(period => {
      this.createSelectorQuery().select(`#chart-${period.name}`).boundingClientRect(rect => {
        if (!rect || rect.width <= 0 || rect.height <= 0 || this._unloaded || model !== this._model) return;
        const layout = { rect, left: 30, top: 12, right: rect.width - 8, bottom: rect.height - 26 };
        this._chartRects[period.name] = layout;
        this.paintChart(period, layout, this._selection[period.name]);
      }).exec();
    });
  },

  paintChart(period, layout, selected) {
    const ctx = wx.createCanvasContext(`chart-${period.name}`, this);
    const { rect, left, top, right, bottom } = layout;
    const x = minute => left + (minute - period.start) / (period.end - period.start) * (right - left);
    const y = value => bottom - value / period.maximum * (bottom - top);
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.setLineDash([]);
    ctx.setLineWidth(1);
    ctx.setFontSize(10);
    ctx.setTextBaseline('middle');
    [0, period.maximum / 2, period.maximum].forEach(value => {
      ctx.setStrokeStyle('#e6e8f1');
      ctx.beginPath();
      ctx.moveTo(left, y(value));
      ctx.lineTo(right, y(value));
      ctx.stroke();
      ctx.setFillStyle('#686d84');
      ctx.setTextAlign('right');
      ctx.fillText(String(value), left - 8, y(value));
    });
    [period.start, (period.start + period.end) / 2, period.end].forEach((minute, index) => {
      ctx.setTextAlign(['left', 'center', 'right'][index]);
      ctx.fillText(timeLabel(Math.round(minute)), x(minute), bottom + 18);
    });
    ctx.setStrokeStyle('#3679ee');
    ctx.setLineWidth(1.75);
    period.points.forEach((point, index) => {
      const previous = period.points[index - 1];
      if (point.connectFromPrevious) {
        ctx.beginPath();
        ctx.moveTo(x(previous.minute), y(previous.value));
        ctx.lineTo(x(point.minute), y(point.value));
        ctx.stroke();
      }
      ctx.setFillStyle(point.value === 0 ? '#dc6259' : '#3679ee');
      ctx.beginPath();
      ctx.arc(x(point.minute), y(point.value), period.points.length === 1 ? 3 : 1.5, 0, Math.PI * 2);
      ctx.fill();
    });
    if (selected) {
      ctx.setLineDash([3, 3]);
      ctx.setLineWidth(1);
      ctx.setStrokeStyle('#aebbd9');
      ctx.beginPath();
      ctx.moveTo(x(selected.minute), top);
      ctx.lineTo(x(selected.minute), bottom);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.setStrokeStyle('#3679ee');
      ctx.setFillStyle('#ffffff');
      ctx.setLineWidth(2);
      ctx.beginPath();
      ctx.arc(x(selected.minute), y(selected.value), 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.draw();
  },
});
