import { fetchAllPartnerMerchants } from "../../repository/perkRepo";
import { navigateToPerkDetail, navigateToProfile } from "../../pages/router";
const app = getApp();
const COLLAPSED_SCROLL_TOP = 150;
const MIN_TITLE_SCALE = 0.5;
const MIN_SUBTITLE_SCALE = 0.9;
const MAX_APP_BAR_HEIGHT = 150; //px

Page({
  /**
   * Page initial data
   */
  data: {
    toolbarHeight: app.globalData.toolbarHeight,
    statusBarHeight: app.globalData.statusBarHeight,
    titleScale: 1.0,
    appBarHeight: MAX_APP_BAR_HEIGHT,
    collapsed: false,
  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad(options) {
    this.fetchAllPartnerMerchants();
  },

  onPageScrolled(e) {
    const scrollTop = Math.min(COLLAPSED_SCROLL_TOP, e.detail.scrollTop);
    const minAppBarHeight =
      app.globalData.toolbarHeight + app.globalData.statusBarHeight;
    const appBarHeight =
      MAX_APP_BAR_HEIGHT -
      (MAX_APP_BAR_HEIGHT - minAppBarHeight) *
        (scrollTop / COLLAPSED_SCROLL_TOP);
    const collapsed = appBarHeight == minAppBarHeight;
    if (this.data.collapsed === true && collapsed === true) {
      return;
    }
    const titleScale =
      1.0 - (scrollTop / COLLAPSED_SCROLL_TOP) * (1.0 - MIN_TITLE_SCALE);
    const subtitleScale =
      1.0 - (scrollTop / COLLAPSED_SCROLL_TOP) * (1.0 - MIN_SUBTITLE_SCALE);

    this.setData({
      titleScale,
      subtitleScale,
      appBarHeight,
      collapsed,
    });
  },

  fetchAllPartnerMerchants() {
    fetchAllPartnerMerchants().then((res) => {
      if (res.success) {
        const partnerMerchants = res.data.map((item) => {
          item.commentCount = item.comments ? item.comments.length : 0;
          item.comments = item.comments
            ? item.comments.filter((comment) => comment._openid).slice(0, 3)
            : [];
          return item;
        });
        this.setData({
          partnerMerchants,
        });
      }
    });
  },

  onPartnerMerchantItemTap(e) {
    const partnerMerchantId = e.currentTarget.dataset.partnerMerchantId;
    navigateToPerkDetail(partnerMerchantId);
  },

  onGoProfile(e) {
    const userId = e.currentTarget.dataset.userId;
    navigateToProfile(userId);
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

  /**
   * Called when user click on the top right corner to share
   */
  onShareAppMessage() {},
});
