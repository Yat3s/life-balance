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
    patchVideoAd: null,
    adId: LUCK_DRAW_AD_TEMP_ID,
  },

  lifetimes: {
    attached() {
      this.checkParticipationStatus();
    },

    detached() {
      if (this.data.patchVideoAd) {
        this.data.patchVideoAd.destroy();
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
      const { luckDraw, userInfo } = this.properties;
      if (!luckDraw?.tickets || !userInfo) return;

      const hasParticipated = luckDraw.tickets.some(
        (ticket) => ticket.userId === userInfo._openid
      );

      this.setData({ hasParticipated });
    },

    setupPatchVideoAd() {
      if (!wx.createRewardedVideoAd) return;

      const patchVideoAd = wx.createRewardedVideoAd({
        adUnitId: LUCK_DRAW_AD_TEMP_ID,
      });

      patchVideoAd.onLoad(() => {
        console.log("Patch video ad loaded successfully");
      });

      patchVideoAd.onError((err) => {
        console.error("Failed to load custom video ad", err);
      });

      patchVideoAd.onClose(() => {
        console.log("Patch video ad closed");
      });

      this.setData({ patchVideoAd });
    },

    showPatchAd() {
      if (!this.data.patchVideoAd) {
        this.setupPatchVideoAd();
      }

      this.data.patchVideoAd?.show().catch(() => {
        this.data.patchVideoAd
          ?.load()
          .then(() => this.data.patchVideoAd.show())
          .catch((err) => {
            console.error("Failed to display patch video ad", err);
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
