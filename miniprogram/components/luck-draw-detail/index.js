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
    hasParticipated: false,
    adId: LUCK_DRAW_CUSTOM_AD_ID,
  },

  lifetimes: {
    attached() {
      this.checkParticipationStatus();
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
