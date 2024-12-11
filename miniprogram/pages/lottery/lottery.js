import { formatDate } from "../../lib/utils";
import {
  fetchAllLotteries,
  createLotteryTicket,
  drawLottery,
} from "../../repository/lotteryRepo";
import { fetchUserInfo } from "../../repository/userRepo";
import { navigateToLotteryHistory } from "../router";

const CHECK_LOTTERY_RESULT_DURATION = 500;
const LOTTERY_SUBSCRIPTION_TEMP_ID =
  "wV8HUYugxQ3OI9MBkEPXMutZnOPHtQsu1tdMCoxOgi8";
const POLLING_INTERVAL = 5000; // 5 seconds
const ENABLE_POLLING = false;

Page({
  data: {
    currentLottery: null,
    pastLotteries: null,
    videoAd: null,
    pollingTimer: null,
    isPolling: false,
  },

  onLoad(options) {
    fetchUserInfo().then((res) => {
      this.setData(
        {
          userInfo: res,
        },
        () => {
          this.setupVideoAd();
          this.fetchLotteryData();
          if (ENABLE_POLLING) {
            console.log("[Polling] Polling feature is enabled");
            this.startPolling();
          } else {
            console.log("[Polling] Polling feature is disabled");
          }
        }
      );
    });
  },

  onUnload() {
    if (ENABLE_POLLING) {
      this.stopPolling();
    }
  },

  onHide() {
    if (ENABLE_POLLING) {
      this.stopPolling();
    }
  },

  onShow() {
    if (ENABLE_POLLING && !this.data.isPolling) {
      this.startPolling();
    }
  },

  startPolling() {
    if (!ENABLE_POLLING) {
      console.log("[Polling] Polling feature is disabled, skipping start");
      return;
    }

    if (this.data.isPolling) {
      console.log("[Polling] Already polling, skipping start");
      return;
    }

    console.log("[Polling] Starting polling service");
    this.setData({ isPolling: true });
    this.fetchLotteryData(); // Initial fetch

    const pollingTimer = setInterval(() => {
      const { currentLottery } = this.data;

      if (currentLottery && !currentLottery.winners.length) {
        console.log("[Polling] Checking lottery status", {
          lotteryId: currentLottery._id,
          phase: currentLottery.phase,
          timestamp: new Date().toISOString(),
        });
        this.fetchLotteryData();
      } else {
        console.log("[Polling] Stopping - lottery completed or invalid", {
          hasCurrentLottery: !!currentLottery,
          hasWinners: currentLottery?.winners ? true : false,
          timestamp: new Date().toISOString(),
        });
        this.stopPolling();
      }
    }, POLLING_INTERVAL);

    this.setData({ pollingTimer });
  },

  stopPolling() {
    if (this.data.pollingTimer) {
      console.log("[Polling] Stopping polling service");
      clearInterval(this.data.pollingTimer);
      this.setData({
        pollingTimer: null,
        isPolling: false,
      });
    }
  },

  async debugDrawLottery() {
    try {
      wx.showLoading({ title: "开奖中..." });
      const result = await drawLottery(this.data.currentLottery._id);
      wx.hideLoading();

      if (result.success) {
        wx.showToast({
          title: "开奖成功",
          icon: "success",
        });
        this.fetchLotteryData();
        setTimeout(() => {
          this.checkLotteryResult();
        }, CHECK_LOTTERY_RESULT_DURATION);
      } else {
        wx.showToast({
          title: result.error || "开奖失败",
          icon: "none",
        });
      }
    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: error.message || "开奖失败",
        icon: "none",
      });
    }
  },

  checkLotteryResult() {
    const { currentLottery, userInfo } = this.data;
    if (!currentLottery || !currentLottery.winners || !userInfo) return;

    console.log("Checking result:", {
      winners: currentLottery.winners,
      userOpenId: userInfo._openid,
    });

    const isWinner = currentLottery.winners.some(
      (winner) => winner.userId === userInfo._openid
    );

    wx.showToast({
      title: isWinner ? "恭喜您中奖啦！" : "很遗憾未能中奖",
      icon: isWinner ? "success" : "none",
      duration: 2000,
    });
  },

  subscribeNotification(tempId, title, content) {
    wx.showModal({
      title,
      content,
      success: (res) => {
        if (res.confirm) {
          wx.requestSubscribeMessage({
            tmplIds: [tempId],
            success: (res) => {
              this.createTicket();
            },
            fail: (err) => {
              console.error("Subscribe failed:", err);
              this.createTicket();
            },
          });
        } else if (res.cancel) {
          this.createTicket();
        }
      },
    });
  },

  previewImage(e) {
    const images = e.currentTarget.dataset.lottery.prizeTiers[0].images || [];
    wx.previewImage({
      urls: images,
    });
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
          this.subscribeNotification(
            LOTTERY_SUBSCRIPTION_TEMP_ID,
            "抽奖提醒",
            "是否订阅抽奖结果通知？"
          );
        } else {
          wx.showToast({
            title: "需要观看完整视频才能参与",
            icon: "none",
          });
        }
      });
    }
  },

  async fetchLotteryData() {
    try {
      const now = Date.now();
      const res = await fetchAllLotteries();

      if (!res.data.length) return;

      const allLotteries = res.data.sort((a, b) => a.createdAt - b.createdAt);
      const lotteriesWithPhase = allLotteries.map((lottery, index) => ({
        ...lottery,
        phase: index + 1,
        formattedDrawTime: formatDate(lottery.drawnAt),
      }));

      const latestLottery = lotteriesWithPhase[lotteriesWithPhase.length - 1];
      const past = lotteriesWithPhase
        .filter((lottery) => lottery._id !== latestLottery._id)
        .sort((a, b) => b.createdAt - a.createdAt);

      const hasParticipated =
        latestLottery?.tickets?.some(
          (ticket) => ticket.userId === this.data.userInfo._openid
        ) || false;

      // Check if lottery status has changed
      const previousLottery = this.data.currentLottery;
      if (
        previousLottery &&
        latestLottery.winners &&
        !previousLottery.winners
      ) {
        console.log("[Polling] Lottery results detected", {
          lotteryId: latestLottery._id,
          phase: latestLottery.phase,
          winnersCount: latestLottery.winners.length,
          timestamp: new Date().toISOString(),
        });

        setTimeout(() => {
          this.checkLotteryResult();
        }, CHECK_LOTTERY_RESULT_DURATION);
      }

      this.setData({
        currentLottery: latestLottery,
        pastLotteries: past,
        now,
        hasParticipated,
      });
    } catch (error) {
      console.error("Failed to fetch lottery data:", error);
    }
  },

  async createTicket() {
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
    this.setData({
      showingModal: "ads-desc",
    });
  },

  hideModal() {
    if (this.data.showingModal === "ads-desc" && this.data.videoAd) {
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

    this.setData({
      showingModal: null,
    });
  },

  onTapLotteryHistory(e) {
    const lottery = e.currentTarget.dataset.lottery;
    navigateToLotteryHistory(lottery._id);
  },

  onShareAppMessage() {
    const title = this.data.currentLottery?.title
      ? `「${this.data.currentLottery.title}」抽奖进行中，快来参与吧~`
      : "精彩抽奖等你来";

    return {
      title,
      imageUrl: this.data.currentLottery.prizeTiers[0]?.images[0],
      path: "/pages/lottery/lottery",
    };
  },

  onShareTimeline() {},
});
