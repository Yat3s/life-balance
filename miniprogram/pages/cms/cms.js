import {
  navigateToFeatureFlagManagement,
  navigateToVerificationManagement,
} from "../router";

Page({
  /**
   * Page initial data
   */
  data: {},

  /**
   * Lifecycle function--Called when page load
   */
  onLoad(options) {},

  onFeatureFlagManagementClick() {
    navigateToFeatureFlagManagement();
  },

  onVerificationManagementClick() {
    navigateToVerificationManagement();
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
