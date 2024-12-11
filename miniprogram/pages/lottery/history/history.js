import { formatDate } from "../../../lib/utils";
import { fetchLotteryById } from "../../../repository/lotteryRepo";
import { fetchUserInfo } from "../../../repository/userRepo";

Page({
  data: {
    lottery: null,
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

    Promise.all([fetchUserInfo(), fetchLotteryById(options.id)])
      .then(([userInfo, lotteryData]) => {
        if (!lotteryData) {
          wx.showToast({
            title: "抽奖信息不存在",
            icon: "none",
          });
          wx.navigateBack();
          return;
        }

        const formattedLottery = {
          ...lotteryData.data[0],
          formattedDrawTime: formatDate(lotteryData.data[0].drawnAt),
        };

        const hasParticipated =
          formattedLottery.tickets?.some(
            (ticket) => ticket.userId === userInfo._openid
          ) || false;

        this.setData({
          lottery: formattedLottery,
          userInfo,
          hasParticipated,
        });
      })
      .catch((error) => {
        console.error("Failed to fetch lottery history:", error);
        wx.showToast({
          title: "加载失败",
          icon: "none",
        });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      });
  },

  onShareAppMessage() {
    const { lottery } = this.data;
    return {
      title: `${lottery.title}`,
      path: `/pages/lottery/history/history?id=${lottery._id}`,
    };
  },

  onShareTimeline() {},
});
