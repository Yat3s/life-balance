const app = getApp();
const {
  getAppConfig
} = require('../../repository/baseRepo');
const userRepo = require('../../repository/userRepo');

Page({
  data: {
    showingModal: "",
    currentTab: "home",
    navigationBarHeight: app.globalData.navigationBarHeight, // Safe area
    selectedGenderIndex: 0,

    pages: [{
        id: "home",
        title: "Dashboard",
        icon: "../../images/ic_dashboard.png"
      }, {
        id: "activity",
        title: "Activity",
        icon: "../../images/ic_activity.png"
      },
      {
        id: "user",
        title: "User",
        icon: "../../images/ic_user.png"
      }
    ]
  },

  onTabSelect: function (e) {
    const currentTab = e.currentTarget.dataset.tabid;
    this.setData({
      currentTab
    });

    const { isSignup } = this.data;

    if (currentTab == 'profile' && !app.globalData.userInfo && !isSignup) {
      this.setData({
        isSignup: true
      });
      userRepo.fetchUserInfoOrSignup().then(res => {
        this.setData({
          isSignup: false
        });
      }).catch(error => {
        this.setData({
          isSignup: false
        });
      });
    }
  },

  onLoad: function (options) {
    const {
      windowWidth,
      statusBarHeight
    } = app.globalData;
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

    // App Config
    getAppConfig().then(config => {
      const {
        featureFlags,
      } = config;

      const { pages } = this.data;
      const carpoolTabItem = {
        id: "carpool",
        title: "Carpool",
        icon: "../../images/ic_carpool.png"
      }

      if (featureFlags.carpoolEnabled) {
        pages.splice(2, 0, carpoolTabItem);
      }

      this.setData({
        featureFlags,
        pages
      })
    })
  },

  onReady: function () {

  },

  onShow: function () {
    if (app.globalData.pendingMessage) {
      wx.showToast({
        icon: 'none',
        duration: 3000,
        title: app.globalData.pendingMessage,
      })
      app.globalData.pendingMessage = null;
    }
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