const LUCK_DRAW_CUSTOM_AD_ID = "adunit-dce02371b9b9348d";

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

  data: {
    adId: LUCK_DRAW_CUSTOM_AD_ID,
  },

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
