import { formatDate } from "../../lib/utils";
import {
  fetchAllLotteries,
  createLotteryTicket,
} from "../../repository/lotteryRepo";
const app = getApp();

Page({
  data: {
    currentLottery: null,
    pastLotteries: [],
    videoAd: null,
  },

  onLoad(options) {
    this.setupVideoAd();
    this.fetchLotteryData();
  },

  setupVideoAd() {
    if (wx.createRewardedVideoAd) {
      this.setData({
        videoAd: wx.createRewardedVideoAd({
          adUnitId: "adunit-56ed7dde157954eb",
        }),
      });

      this.data.videoAd.onLoad(() => {
        console.log("Video ad loaded successfully");
      });

      this.data.videoAd.onError((err) => {
        console.error("Failed to load video ad", err);
      });

      this.data.videoAd.onClose((res) => {
        if (res && res.isEnded) {
          this.handleAdReward();
        } else {
          wx.showToast({
            title: "需要观看完整视频才能参与",
            icon: "none",
          });
        }
      });
    }
  },

  fetchLotteryData() {
    const now = Date.now();

    fetchAllLotteries().then((res) => {
      if (!res.data.length) return;

      const allLotteries = res.data.sort((a, b) => a.createdAt - b.createdAt);

      const lotteriesWithPhase = allLotteries.map((lottery, index) => ({
        ...lottery,
        phase: index + 1,
        formattedDrawTime: formatDate(lottery.drawnAt),
      }));

      const current = lotteriesWithPhase.find(
        (lottery) => lottery.drawnAt > now
      );
      const past = lotteriesWithPhase
        .filter((lottery) => lottery.drawnAt <= now)
        .sort((a, b) => b.createdAt - a.createdAt);

      const hasParticipated =
        current?.tickets?.some(
          (ticket) => ticket.userId === app.globalData.userInfo._openid
        ) || false;

      this.setData({
        currentLottery: current,
        pastLotteries: past,
        now,
        hasParticipated,
      });
    });
  },

  async handleAdReward() {
    try {
      if (!this.data.currentLottery?._id) {
        wx.showToast({
          title: "没有进行中的抽奖活动",
          icon: "none",
        });
        return;
      }

      wx.showLoading({ title: "处理中" });
      const ticket = await createLotteryTicket(this.data.currentLottery._id);

      if (!ticket.success) {
        wx.hideLoading();
        wx.showToast({
          title: ticket.message || "参与失败",
          icon: "none",
        });
        return;
      }

      wx.hideLoading();
      wx.showToast({
        title: "参与成功！",
        icon: "success",
      });
      this.fetchLotteryData();
    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: error.message || "参与失败",
        icon: "error",
      });
    }
  },

  onJoinLottery() {
    if (this.data.videoAd) {
      this.data.videoAd.show().catch(() => {
        this.data.videoAd
          .load()
          .then(() => this.data.videoAd.show())
          .catch((err) => {
            console.error("Failed to display video ad", err);
            wx.showToast({
              title: "广告加载失败",
              icon: "none",
            });
          });
      });
    }
  },

  onShareAppMessage() {
    return {
      title: this.data.currentLottery?.title || "抽奖活动",
      path: "/pages/lottery/lottery",
    };
  },
});
