import { fetchLuckDrawById } from "../../../repository/luckDrawRepo";
import { fetchUserInfo } from "../../../repository/userRepo";

Page({
  data: {
    luckDraw: null,
    userInfo: null,
  },

  onLoad(options) {
    if (!options.id) {
      wx.showToast({
        title: "抽奖信息不存在",
        icon: "none",
      });
      wx.navigateBack();
      return;
    }

    Promise.all([fetchUserInfo(), fetchLuckDrawById(options.id)])
      .then(([userInfo, luckDraw]) => {
        if (!luckDraw) {
          wx.showToast({
            title: "抽奖信息不存在",
            icon: "none",
          });
          wx.navigateBack();
          return;
        }

        this.setData({
          luckDraw,
          userInfo,
        });
      })
      .catch((error) => {
        console.error("Failed to fetch luck draw history:", error);
        wx.showToast({
          title: "加载失败",
          icon: "none",
        });
        wx.navigateBack();
      });
  },

  onShareAppMessage() {
    const { luckDraw } = this.data;
    return {
      title: luckDraw.title,
      imageUrl: luckDraw.prizeTiers[0]?.images[0],
      path: `/pages/luck-draw/history/history?id=${luckDraw._id}`,
    };
  },

  onShareTimeline() {},
});
