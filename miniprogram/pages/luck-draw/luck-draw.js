import {
  createLuckDrawTicket,
  draw,
  fetchLuckDrawById,
  fetchLuckDrawHistory,
} from "../../repository/luckDrawRepo";
import { fetchUserInfo } from "../../repository/userRepo";
import { navigateToLuckDrawHistory } from "../router";

const CHECK_DRAW_RESULT_DURATION = 500;
const LUCK_DRAW_SUBSCRIPTION_TEMP_ID =
  "wV8HUYugxQ3OI9MBkEPXMutZnOPHtQsu1tdMCoxOgi8";
const ADS_MODAL_SHOWN_KEY = "ads_modal_shown";
const ADS_TEMP_ID = "adunit-56ed7dde157954eb";

Page({
  data: {
    currentLuckDraw: null,
    previousLuckDraws: null,
    videoAd: null,
  },

  async onLoad(options) {
    fetchUserInfo().then((res) => {
      this.setData({
        userInfo: res,
      });
    });
    if (options.id) {
      await this.fetchCurrentLuckDraw(options.id);
    }
    const luckDrawHistory = await fetchLuckDrawHistory();
    this.setData({
      previousLuckDraws: luckDrawHistory.filter(
        (draw) => draw._id !== options.id
      ),
    });
  },

  async fetchCurrentLuckDraw(luckDrawId) {
    const currentLuckDraw = await fetchLuckDrawById(luckDrawId);
    this.setData({ currentLuckDraw });
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
        this.fetchCurrentLuckDraw(this.data.currentLuckDraw._id);
        setTimeout(() => {
          this.checkDrawResult();
        }, CHECK_DRAW_RESULT_DURATION);
      } else {
        wx.showToast({
          title: result.message || "开奖失败",
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
    const images = e.currentTarget.dataset.luckDraw.prizeTiers[0].images || [];
    wx.previewImage({
      urls: images,
    });
  },

  onVideoAdClose: function (res) {
    const that = this;
    if (res && res.isEnded) {
      wx.getSetting({
        withSubscriptions: true,
        success: (res) => {
          const subscriptionsSetting = res.subscriptionsSetting;
          const isAccepted =
            subscriptionsSetting.itemSettings?.[
              LUCK_DRAW_SUBSCRIPTION_TEMP_ID
            ] === "accept";

          if (!isAccepted) {
            that.subscribeNotification(
              LUCK_DRAW_SUBSCRIPTION_TEMP_ID,
              "开奖提醒订阅",
              "为了及时收到开奖结果通知，建议订阅开奖提醒。不订阅的话将无法收到开奖通知哦～"
            );
          } else {
            that.createTicket();
          }
        },
        fail: () => {
          that.createTicket();
        },
      });
    } else {
      wx.showToast({
        title: "需要观看完整视频才能参与",
        icon: "none",
      });
    }
  },

  setupVideoAd() {
    if (wx.createRewardedVideoAd) {
      this.setData({
        videoAd: wx.createRewardedVideoAd({
          adUnitId: ADS_TEMP_ID,
        }),
      });

      this.data.videoAd.onLoad(() => {
        console.log("Video ad loaded successfully");
      });

      this.data.videoAd.onError((err) => {
        console.error("Failed to load video ad", err);
      });

      this.data.videoAd.onClose(this.onVideoAdClose.bind(this));
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

      const result = await createLuckDrawTicket(this.data.currentLuckDraw._id);

      if (result.success) {
        await this.fetchCurrentLuckDraw(this.data.currentLuckDraw._id);

        const isFirstTime = this.data.currentLuckDraw.userTickets.length === 1;
        wx.showToast({
          title: isFirstTime ? "参与成功！" : "提高概率成功！",
          icon: "success",
        });
      } else {
        wx.showToast({
          title: result.message || "参与失败",
          icon: "none",
        });
      }

      wx.hideLoading();
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
      this.setData({ showingModal: "ads-desc" });
      wx.setStorageSync(ADS_MODAL_SHOWN_KEY, true);
      this.setupVideoAd();
    } else {
      this.showVideoAd();
    }
  },

  showVideoAd() {
    if (!this.data.videoAd) {
      this.setupVideoAd();
    }

    this.data.videoAd?.show().catch(() => {
      this.data.videoAd
        ?.load()
        .then(() => this.data.videoAd.show())
        .catch((err) => {
          console.error("Failed to display video ad", err);
          wx.showToast({
            title: "广告加载失败",
            icon: "none",
          });
        });
    });
  },

  hideModal() {
    if (this.data.showingModal === "ads-desc") {
      this.showVideoAd();
    }

    this.setData({ showingModal: null });
  },

  onTapLuckDrawHistory(e) {
    const luckDraw = e.currentTarget.dataset.luckDraw;
    navigateToLuckDrawHistory(luckDraw._id);
  },

  onShareAppMessage() {
    const title = this.data.currentLuckDraw?.title
      ? `「${this.data.currentLuckDraw.title}」抽奖进行中，快来参与吧~`
      : "精彩抽奖等你来";

    return {
      title,
      imageUrl: this.data.currentLuckDraw.prizeTiers[0]?.images[0],
      path: `/pages/luck-draw/luck-draw?id=${this.data.currentLuckDraw._id}`,
    };
  },

  onShareTimeline() {},
});
