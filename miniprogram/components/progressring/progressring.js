Component({
  options: {
    addGlobalClass: true,
  },
  properties: {
    isLoading: {
      type: Boolean,
      value: true,
      observer(oldVal, newVal) {
        if (newVal) {
          this.resetAnimation();
        }
      },
    },
    targetProgress: {
      type: Number,
      value: 0,
    },
    initialColor: {
      type: String,
      value: "#3679FF",
    },
    finalColor: {
      type: String,
      value: "#3679FF",
    },
    progressDuration: {
      type: Number,
      value: 0.3,
    },
    colorChangeDuration: {
      type: Number,
      value: 0.6,
    },
  },
  data: {
    animationStyle: "",
  },
  lifetimes: {
    attached() {
      // trigger animation when component is initialized
      this.resetAnimation();
    },
  },
  methods: {
    resetAnimation() {
      // clear animation style, avoid overlap
      this.setData({
        animationStyle: "",
      });
      // reset animation
      setTimeout(() => {
        this.setData({
          animationStyle: `animation: progress ${this.data.progressDuration}s linear forwards, 
                           color-change ${this.data.colorChangeDuration}s linear forwards;`,
        });
      }, 50);
    },
  },
});
