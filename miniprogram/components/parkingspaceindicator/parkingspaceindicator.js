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
    indicatorsCount: {
      type: Number,
      value: 0,
    },
  },
  data: {
    widthAnimationStyle: "",
  },
  lifetimes: {
    attached() {
      // Trigger animation when component is initialized
      this.resetAnimation();
    },
  },
  methods: {
    resetAnimation() {
      // Reset the animation to avoid overlap
      this.setData({
        widthAnimationStyle: "",
      });
      // Re-trigger the animation with new target progress value
      setTimeout(() => {
        this.setData({
          widthAnimationStyle: `animation: widthChange 1.5s ease-in-out forwards;`,
        });
      }, 50);
    },
  },
});
