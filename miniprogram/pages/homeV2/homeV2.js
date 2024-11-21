const {
  getDateInEnglish
} = require("../../common/util");
const {
  fetchUserInfo
} = require("../../repository/userRepo");

const app = getApp();
const COLLAPSED_SCROLL_TOP = 60;
const MIN_TITLE_SCALE = 0.75;
const MIN_AVATAR_SCALE = 0.75;
const MAX_APP_BAR_HEIGHT = 100; //px

Component({
  options: {
    addGlobalClass: true,
  },
  properties: {},
  data: {
    toolbarHeight: app.globalData.toolbarHeight,
    statusBarHeight: app.globalData.statusBarHeight,
    appBarHeight: MAX_APP_BAR_HEIGHT,
    collapsed: false,
  },

  lifetimes: {
    attached() {
      const nowDateInEnglish = getDateInEnglish(Date.now());
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
        nowDateInEnglish,
      });
      this.fetchDashboardData();
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
    },
    fetchDashboardData() {
      fetchUserInfo().then((userInfo) => {
        this.setData({
          userInfo,
        });
      });
    },
  },
});