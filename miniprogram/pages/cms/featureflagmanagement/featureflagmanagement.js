import { updateAppconfig } from "../../../repository/appconfigRepo";
import { getAppConfig } from "../../../repository/baseRepo";

Page({
  /**
   * Page initial data
   */
  data: {},

  /**
   * Lifecycle function--Called when page load
   */
  onLoad(options) {
    this.fetchFeatureFlags();
  },

  fetchFeatureFlags() {
    getAppConfig().then((config) => {
      const featureFlags = config.featureFlags;
      const featureList = Object.entries(featureFlags).map(([key, value]) => ({
        key,
        value,
      }));
      this.setData({
        configId: config._id,
        featureFlags,
        featureList,
      });
    });
  },

  handleSwitchChange(e) {
    const { key } = e.currentTarget.dataset;
    const { value } = e.detail;
    this.setData({
      featureFlags: {
        ...this.data.featureFlags,
        [key]: value,
      },
    });
  },

  updateAppconfig() {
    const { configId, featureFlags } = this.data;
    updateAppconfig(configId, {
      featureFlags,
    })
      .then((res) => {
        if (res.success) {
          wx.showToast({
            title: "Update Success",
          });
        } else {
          wx.showToast({
            title: "Update Failed",
            icon: "none",
          });
        }
      })
      .catch((err) => {
        wx.showToast({
          title: "Update Failed",
          icon: "none",
        });
      });
  },

  /**
   * Lifecycle function--Called when page is initially rendered
   */
  onReady() {},

  /**
   * Lifecycle function--Called when page show
   */
  onShow() {},

  /**
   * Lifecycle function--Called when page hide
   */
  onHide() {},

  /**
   * Lifecycle function--Called when page unload
   */
  onUnload() {},

  /**
   * Page event handler function--Called when user drop down
   */
  onPullDownRefresh() {},

  /**
   * Called when page reach bottom
   */
  onReachBottom() {},
});
