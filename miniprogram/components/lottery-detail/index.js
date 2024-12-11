Component({
  properties: {
    lottery: {
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
      const images = this.data.lottery.prizeTiers[0].images || [];
      wx.previewImage({
        urls: images,
      });
    },
  },
});
