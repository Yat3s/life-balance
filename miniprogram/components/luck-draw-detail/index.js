const LUCK_DRAW_AD_TEMP_ID = "adunit-dce02371b9b9348d";

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
    hasParticipated: false,
    customAd: null,
    adId: LUCK_DRAW_AD_TEMP_ID,
  },

  lifetimes: {
    attached() {
      this.checkParticipationStatus();
    },

    detached() {
      if (this.data.customAd) {
        this.data.customAd.destroy();
      }
    },
  },

  observers: {
    "luckDraw, userInfo": function (luckDraw, userInfo) {
      if (luckDraw && userInfo) {
        this.checkParticipationStatus();
      }
    },
  },

  methods: {
    checkParticipationStatus() {
      const { luckDraw, userInfo } = this.data;
      if (!luckDraw?.tickets || !userInfo) return;

      const hasParticipated = luckDraw.tickets.some(
        (ticket) => ticket.userId === userInfo._openid
      );

      this.setData({ hasParticipated });
    },

    setupCustomAd() {
      if (!wx.createRewardedVideoAd) return;

      const customAd = wx.createRewardedVideoAd({
        adUnitId: LUCK_DRAW_AD_TEMP_ID,
      });

      customAd.onLoad(() => {
        console.log("Custom ad loaded successfully");
      });

      customAd.onError((err) => {
        console.error("Failed to load custom video ad", err);
      });

      customAd.onClose(() => {
        console.log("Custom ad closed");
      });

      this.setData({ customAd });
    },

    showPatchAd() {
      if (!this.data.customAd) {
        this.setupCustomAd();
      }

      this.data.customAd?.show().catch(() => {
        this.data.customAd
          ?.load()
          .then(() => this.data.customAd.show())
          .catch((err) => {
            console.error("Failed to display custom ad", err);
          });
      });
    },

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
