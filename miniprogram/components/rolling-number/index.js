const DIGIT_HEIGHT = 1.2;

Component({
  properties: {
    value: {
      type: Number,
      value: -1,
      observer: "onValueChanged",
    },
  },
  data: {
    ready: false,
    rolling: false,
    displayValue: "",
    reels: [],
  },
  lifetimes: {
    attached() {
      this._attached = true;
      this._settledValue = null;
      this._run = 0;
      if (Number.isSafeInteger(this.data.value) && this.data.value >= 0) {
        this.settle(this.data.value);
      }
    },
    detached() {
      this._attached = false;
      clearTimeout(this._reelTimer);
      this._reelTimer = null;
    },
  },
  pageLifetimes: {
    hide() {
      this._hidden = true;
      if (this.data.value >= 0) this.settle(this.data.value);
    },
    show() {
      this._hidden = false;
    },
  },
  methods: {
    onValueChanged(value) {
      if (!this._attached || !Number.isSafeInteger(value) || value < 0) return;
      if (this._hidden) {
        this.settle(value);
      } else if (!this._reelTimer && value !== this._settledValue) {
        this.rollTo(value);
      }
      // During a spin, value keeps the latest result; pick it up when the reels stop.
    },

    settle(value) {
      clearTimeout(this._reelTimer);
      this._reelTimer = null;
      this._settledValue = value;
      const run = ++this._run;
      this.setData({
        ready: true,
        rolling: false,
        displayValue: String(value),
        reels: String(value).split("").map((digit, index) => ({
          id: `${run}-${index}`,
          digits: [{ id: 0, value: digit }],
          style: "",
          spinning: false,
        })),
      });
    },

    rollTo(value) {
      const from = this._settledValue === null ? "0" : String(this._settledValue);
      const to = String(value);
      const width = Math.max(from.length, to.length);
      const previous = from.padStart(width, " ");
      const target = to.padStart(width, " ");
      const run = ++this._run;
      const direction = value > (this._settledValue ?? 0) ? 1 : -1;
      let duration = 0;
      const reels = Array.from({ length: width }, (_, index) => {
        const first = previous[index] === " " ? "\u00a0" : previous[index];
        const last = target[index] === " " ? "\u00a0" : target[index];
        if (first === last) {
          return {
            id: `${run}-${index}`,
            digits: [{ id: 0, value: last }],
            style: "",
            spinning: false,
          };
        }
        const start = Number(previous[index]);
        const end = Number(target[index]);
        // Follow the count's direction, including carries/borrows, without extra turns.
        const steps = ((end - start) * direction + 10) % 10 || 1;
        const digits = Array.from({ length: steps + 1 }, (_, step) => {
          const digit = step === 0 ? first : step === steps ? last :
            String((start + step * direction + 10) % 10);
          return { id: step, value: digit };
        });
        // Descending digits enter from above; ascending digits enter from below.
        if (direction < 0) digits.reverse();
        const offset = -steps * DIGIT_HEIGHT;
        const reelDuration = Math.min(240 + steps * 45, 650);
        duration = Math.max(duration, reelDuration);
        return {
          id: `${run}-${index}`,
          digits,
          spinning: true,
          style: `--reel-start: ${direction < 0 ? offset : 0}em; --reel-end: ${direction < 0 ? 0 : offset}em; animation-duration: ${reelDuration}ms;`,
        };
      });
      this.setData({ ready: true, rolling: true, reels });
      this._reelTimer = setTimeout(() => {
        this._reelTimer = null;
        if (!this._attached) return;
        this._settledValue = value;
        if (this.data.value !== value) {
          this.onValueChanged(this.data.value);
        } else {
          this.settle(value);
        }
      }, duration + 32);
    },
  },
});
