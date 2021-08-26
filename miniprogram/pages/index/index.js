const app = getApp();
const userRepo = require('../../repository/userRepo');

Page({
  data: {
    currentTab: "activity",

    pages: [{
        id: "activity",
        title: "活动",
        icon: "../../images/ic_activity.png"
      },
      {
        id: "profile",
        title: "我的",
        icon: "../../images/ic_profile.png"
      }
    ]
  },

  onTabSelect: function (e) {
    const currentTab = e.currentTarget.dataset.tabid;
    this.setData({
      currentTab
    });

    if (currentTab == 'profile' && !app.globalData.userInfo) {
      userRepo.fetchUserInfoOrSignup();
    }
  },

  onLoad: function (options) {
    const { windowWidth, statusBarHeight } = app.globalData;
    this.setData({
      tabWidth: windowWidth / (this.data.pages.length + 1),
      statusBarHeight
    });

    // Ensure the authentication
    userRepo.fetchUserInfo().then(userInfo => {
      if (userInfo) {
        app.globalData.userInfo = userInfo;
      }
    })
  },

  onReady: function () {

  },


  onShow: function () {

  },


  onHide: function () {

  },

  onUnload: function () {

  },

  onPullDownRefresh: function () {

  },

  onReachBottom: function () {

  },

  onShareAppMessage: function () {

  }
})