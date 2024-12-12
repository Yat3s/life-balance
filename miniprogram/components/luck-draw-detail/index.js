Component({
  properties: {
    luckDraw: {
      type: Object,
      value: null,
    },
    userInfo: {
      type: Object,
      value: null,
    },
  },

  data: {},

  methods: {
    previewImage() {
      const images = this.data.luckDraw.prizeTiers[0].images || [];
      wx.previewImage({
        urls: images,
      });
    },

    debugDraw() {
      this.triggerEvent("debugDraw", this.data.luckDraw._id);
    },
  },
});
