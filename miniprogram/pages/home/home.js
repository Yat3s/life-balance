const { dateDiff } = require("../../common/util");
const { getAppConfig } = require("../../repository/baseRepo");
const {
  fetchAllRoutes,
  fetchGpsLocation,
} = require("../../repository/busRepo");
const {
  fetchParkingSpace,
  fetchStockData,
  fetchBuilding2Progress,
  fetchFoodMenus,
  fetchWeworkParkingBooking,
  fetchBanners,
} = require("../../repository/dashboardRepo");
const { msftBoost } = require("../../repository/exploreRepo");
const { fetchUserInfo } = require("../../repository/userRepo");
const {
  navigateToWechatGroup,
  navigateToActivityDetail,
  navigateToFoodMenu,
  navigateToCanteenTableSharing,
  navigateToMeal,
  navigateToHowTo,
  navigateToBusInfo,
  navigateToWeworkParking,
  navigateToGlossary,
} = require("../router");

const app = getApp();
const COLLAPSED_SCROLL_TOP = 150;
const MIN_TITLE_SCALE = 0.75;
const MIN_AVATAR_SCALE = 0.75;
const MAX_APP_BAR_HEIGHT = 150; //px

Component({
  options: {
    addGlobalClass: true,
  },
  properties: {},
  data: {
    toolbarHeight: app.globalData.toolbarHeight,
    statusBarHeight: app.globalData.statusBarHeight,
    appBarHeight: MAX_APP_BAR_HEIGHT,
    bannerExpanded: false,
  },

  lifetimes: {
    attached() {
      wx.reportEvent("homepageload", {});
      const nowHours = new Date().getHours();
      let welcomeMessage = "";
      if (nowHours > 0 && nowHours < 5) {
        welcomeMessage = "It's time to sleep!";
      } else if (nowHours >= 5 && nowHours < 12) {
        welcomeMessage = "Good morning!";
      } else if (nowHours >= 12 && nowHours < 18) {
        welcomeMessage = "Good afternoon!";
      } else if (nowHours >= 18 && nowHours < 24) {
        welcomeMessage = "Good evening!";
      }

      this.setData({
        welcomeMessage,
      });
      this.fetchDashboardData();
      this.fetchBanner();
    },
  },

  methods: {
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
      const avatarScale =
        1.0 - (scrollTop / COLLAPSED_SCROLL_TOP) * (1.0 - MIN_AVATAR_SCALE);

      this.setData({
        titleScale,
        avatarScale,
        appBarHeight,
        collapsed,
      });
      console.log(e);
    },

    onCanteenTableClick() {
      navigateToCanteenTableSharing();
    },

    onMealClick() {
      navigateToMeal();
    },

    onGlossaryClicked() {
      navigateToGlossary();
    },

    onBannerClicked: function () {
      this.setData({
        bannerExpanded: !this.data.bannerExpanded,
      });

      wx.reportEvent("bannertap", {
        user_openid: this.data.userInfo._openid,
        toexpand: `${this.data.bannerExpanded}`,
      });
    },

    onBannerLinkClicked: function () {
      wx.setClipboardData({
        data: this.data.banner.link,
      }),
        wx.showToast({
          title: "Link Copied",
        });

      wx.reportEvent("bannerbuttontap", {
        user_openid: this.data.userInfo._openid,
      });
    },

    onBuild2Click() {
      wx.previewImage({
        urls: [this.data.building2LatestProgress.picture],
      });
    },

    fetchBanner: function () {
      fetchBanners().then((res) => {
        if (res && 0 != res.length) {
          this.setData({
            banner: res[0],
          });
        }
      });
    },

    fetchDashboardData() {
      fetchUserInfo().then((userInfo) => {
        this.setData({
          userInfo,
        });
      });

      getAppConfig().then((config) => {
        this.setData({
          notice: config.notice,
        });
      });

      // Building2
      fetchBuilding2Progress().then((building2) => {
        const building2LatestProgress = building2[0];
        const createDate = new Date(building2LatestProgress._createTime);
        building2LatestProgress.createDateStr = `${createDate.dateStr()} ${createDate.hhmm()}`;

        const { building2StartDateStr, building2EndDateStr } = this.data;
        const wholeDayDiff = dateDiff(
          new Date(building2EndDateStr),
          new Date(building2StartDateStr)
        );
        const progressedDiff = dateDiff(
          new Date(),
          new Date(building2StartDateStr)
        );
        const building2Progress = (
          (progressedDiff / wholeDayDiff) *
          100
        ).toFixed(2);

        this.setData({
          building2Progress,
          building2LatestProgress,
        });
      });
    },
  },
});
