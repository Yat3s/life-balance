const { getDateInEnglish } = require("../../common/util");
const { fetchUserInfo } = require("../../repository/userRepo");

const app = getApp();

Component({
  options: {
    addGlobalClass: true,
  },
  properties: {},
  data: {
    toolbarHeight: app.globalData.toolbarHeight,
    statusBarHeight: app.globalData.statusBarHeight,
  },

  lifetimes: {
    attached() {
      wx.reportEvent("homev2pageload", {});
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
    fetchDashboardData() {
      fetchUserInfo().then((userInfo) => {
        this.setData({
          userInfo,
        });
      });
    },
  },
});
