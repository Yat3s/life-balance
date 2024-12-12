import { formatDate } from "../../../lib/utils";
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
      .then(([userInfo, luckDrawData]) => {
        if (!luckDrawData) {
          wx.showToast({
            title: "抽奖信息不存在",
            icon: "none",
          });
          wx.navigateBack();
          return;
        }

        const luckDrawInfo = luckDrawData.data[0];
        const formattedLuckDraw = {
          ...luckDrawInfo,
          formattedDrawTime: formatDate(luckDrawInfo.drawnAt),
          tickets: luckDrawInfo.tickets.map((ticket) => ({
            ...ticket,
            isWinner:
              luckDrawInfo.winners?.some(
                (winner) => winner.userId === ticket.user._openid
              ) || false,
          })),
        };

        const hasParticipated =
          formattedLuckDraw.tickets?.some(
            (ticket) => ticket.userId === userInfo._openid
          ) || false;

        this.setData({
          luckDraw: formattedLuckDraw,
          userInfo,
          hasParticipated,
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
    const prize = luckDraw.prizeTiers[0].name;
    return {
      title: `${prize}`,
      path: `/pages/luck-draw/history/history?id=${luckDraw._id}`,
    };
  },

  onShareTimeline() {},
});
