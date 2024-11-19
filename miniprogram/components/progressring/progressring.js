Component({
  options: {
    addGlobalClass: true,
  },
  properties: {
    targetProgress: {
      type: Number,
      value: 0,
    },
    initialColor: {
      type: String,
      value: "#0051FF",
    },
    finalColor: {
      type: String,
      value: "#0051FF",
    },
    progressDuration: {
      type: Number,
      value: 3,
    },
    colorChangeDuration: {
      type: Number,
      value: 6,
    },
  },
});