import { createReward, updateReward } from "../../repository/rewardRepo";

const PAY_SUCCESS_DURATION = 1500;

Page({
  data: {
    amount: 0,
    isOtherAmount: false,
    message: "",
    showName: true,
    isProcessingPayment: false,
    loadingDots: "",
    loadingTimer: null,
  },

  onLoad(options) {
    const { amount, type } = options;

    this.setData({
      amount: amount || 0,
      isOtherAmount: type === "otherAmount",
    });
  },

  onAmountInput(e) {
    let value = e.detail.value;
    value = value.replace(/[^\d.]/g, "");
    const parts = value.split(".");
    if (parts.length > 2) {
      value = parts[0] + "." + parts.slice(1).join("");
    }
    if (parts.length === 2 && parts[1].length > 2) {
      value = parts[0] + "." + parts[1].slice(0, 2);
    }

    this.setData({ amount: value });
  },

  onMessageInput(e) {
    this.setData({ message: e.detail.value });
  },

  startLoadingAnimation() {
    let count = 0;
    this.data.loadingTimer = setInterval(() => {
      count = (count + 1) % 4;
      this.setData({
        loadingDots: ".".repeat(count),
      });
    }, 500);
  },

  stopLoadingAnimation() {
    if (this.data.loadingTimer) {
      clearInterval(this.data.loadingTimer);
      this.setData({
        loadingDots: "",
      });
    }
  },

  async onReward() {
    if (this.data.isProcessingPayment) return;

    const amount = Number(this.data.amount);
    if (!amount || amount <= 0) {
      wx.showToast({
        title: "Please enter a valid amount",
        icon: "none",
      });
      return;
    }

    this.setData({ isProcessingPayment: true });
    this.startLoadingAnimation();

    try {
      const reward = await createReward(amount);
      const { payment, rewardId, totalFee } = reward;

      const updateRewardData = {
        paid: totalFee,
        message: this.data.message,
      };

      wx.requestPayment({
        ...payment,
        success: async () => {
          try {
            await updateReward(rewardId, updateRewardData);
            wx.showToast({
              title: "Payment successful",
              icon: "success",
            });
            setTimeout(() => {
              wx.navigateBack();
            }, PAY_SUCCESS_DURATION);
          } catch (error) {
            console.error("Update order error:", error);
            wx.showToast({
              title: "Failed to update order status, please contact support",
              icon: "none",
            });
          }
        },
        fail: (error) => {
          console.error("Payment failed:", error);
          wx.showToast({
            title: "Payment failed, please try again",
            icon: "none",
          });
        },
        complete: () => {
          this.setData({ isProcessingPayment: false });
          this.stopLoadingAnimation();
        },
      });
    } catch (error) {
      console.error("Create order error:", error);
      wx.showToast({
        title: "Failed to create order, please try again",
        icon: "none",
      });
      this.setData({ isProcessingPayment: false });
      this.stopLoadingAnimation();
    }
  },

  onUnload() {
    this.stopLoadingAnimation();
  },

  onShareAppMessage() {},
});