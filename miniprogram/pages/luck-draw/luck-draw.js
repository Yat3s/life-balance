import { formatDate } from "../../lib/utils";
import {
  fetchAllLuckDraws,
  createLuckDrawTicket,
  draw,
} from "../../repository/luckDrawRepo";
import { fetchUserInfo } from "../../repository/userRepo";
import { navigateToLuckDrawHistory } from "../router";

const CHECK_DRAW_RESULT_DURATION = 500;
const LUCK_DRAW_SUBSCRIPTION_TEMP_ID =
  "wV8HUYugxQ3OI9MBkEPXMutZnOPHtQsu1tdMCoxOgi8";
const ADS_MODAL_SHOWN_KEY = "ads_modal_shown";

Page({
  data: {
    currentLuckDraw: null,
    previousLuckDraws: null,
    videoAd: null,
  },

  onLoad(options) {
    fetchUserInfo().then((res) => {
      this.setData(
        {
          userInfo: res,
        },
        () => {
          this.setupVideoAd();
          this.fetchLuckDrawData();
        }
      );
    });
  },

  async debugDraw() {
    try {
      wx.showLoading({ title: "开奖中..." });
      const result = await draw(this.data.currentLuckDraw._id);
      wx.hideLoading();

      if (result.success) {
        wx.showToast({
          title: "开奖成功",
          icon: "success",
        });
        this.fetchLuckDrawData();
        setTimeout(() => {
          this.checkDrawResult();
        }, CHECK_DRAW_RESULT_DURATION);
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

  checkDrawResult() {
    const { currentLuckDraw, userInfo } = this.data;
    if (!currentLuckDraw || !currentLuckDraw.winners || !userInfo) return;

    console.log("Checking result:", {
      winners: currentLuckDraw.winners,
      userOpenId: userInfo._openid,
    });

    const isWinner = currentLuckDraw.winners.some(
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
      confirmText: "订阅提醒",
      cancelText: "暂不订阅",
      success: (res) => {
        if (res.confirm) {
          wx.requestSubscribeMessage({
            tmplIds: [tempId],
            success: (res) => {
              if (res[tempId] === "accept") {
                wx.showToast({
                  title: "订阅成功，开奖后将收到通知",
                  icon: "success",
                  duration: 2000,
                });
              }
              this.createTicket();
            },
            fail: (err) => {
              console.error("Subscribe failed:", err);
              wx.showToast({
                title: "未订阅提醒，开奖结果将无法及时通知",
                icon: "none",
                duration: 2000,
              });
              this.createTicket();
            },
          });
        } else if (res.cancel) {
          wx.showToast({
            title: "未订阅提醒，开奖结果将无法及时通知",
            icon: "none",
            duration: 2000,
          });
          this.createTicket();
        }
      },
    });
  },

  previewImage(e) {
    const images = e.currentTarget.dataset.luckDraw.prizeTiers[0].images || [];
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
            LUCK_DRAW_SUBSCRIPTION_TEMP_ID,
            "开奖提醒订阅",
            "为了及时收到开奖结果通知，建议订阅开奖提醒。不订阅的话将无法收到开奖通知哦～"
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

  async fetchLuckDrawData() {
    try {
      const res = await fetchAllLuckDraws();

      if (!res.data.length) return;

      const allLuckDraws = res.data.sort((a, b) => a.createTime - b.createTime);
      const luckDraws = allLuckDraws.map((luckDraw) => ({
        ...luckDraw,
        formattedDrawTime: formatDate(luckDraw.drawnAt),
        tickets: luckDraw.tickets.map((ticket) => ({
          ...ticket,
          isWinner:
            luckDraw.winners?.some(
              (winner) => winner.userId === ticket.user._openid
            ) || false,
        })),
      }));

      const latestLuckDraw = luckDraws[luckDraws.length - 1];
      const previousLuckDraws = luckDraws
        .filter((luckDraw) => luckDraw._id !== latestLuckDraw._id)
        .sort((a, b) => b.createTime - a.createTime);

      const hasParticipated =
        latestLuckDraw?.tickets?.some(
          (ticket) => ticket.userId === this.data.userInfo._openid
        ) || false;

      this.setData({
        currentLuckDraw: latestLuckDraw,
        previousLuckDraws,
        hasParticipated,
      });
    } catch (error) {
      console.error("Failed to fetch luck draw data:", error);
    }
  },

  async createTicket() {
    try {
      if (!this.data.currentLuckDraw?._id) {
        wx.showToast({
          title: "没有进行中的抽奖活动",
          icon: "none",
        });
        return;
      }

      wx.showLoading({ title: "处理中" });

      const ticket = await createLuckDrawTicket(this.data.currentLuckDraw._id);

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

      this.fetchLuckDrawData();
    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: error.message || "参与失败",
        icon: "error",
      });
    }
  },

  onJoinLuckDraw() {
    const hasShownModal = wx.getStorageSync(ADS_MODAL_SHOWN_KEY);

    if (!hasShownModal) {
      this.setData({
        showingModal: "ads-desc",
      });
      wx.setStorageSync(ADS_MODAL_SHOWN_KEY, true);
    } else {
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
    }
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

  onTapLuckDrawHistory(e) {
    const luckDraw = e.currentTarget.dataset.luckDraw;
    navigateToLuckDrawHistory(luckDraw._id);
  },

  onShareAppMessage() {
    const title = this.data.currentLuckDraw?.prizeTiers[0]
      ? `「${this.data.currentLuckDraw.title}」抽奖进行中，快来参与吧~`
      : "精彩抽奖等你来";

    return {
      title,
      imageUrl: this.data.currentLuckDraw.prizeTiers[0]?.images[0],
      path: "/pages/luck-draw/luck-draw",
    };
  },

  onShareTimeline() {},
});
