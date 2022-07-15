const app = getApp();
const {
  getAppConfig
} = require('../../repository/baseRepo');
const userRepo = require('../../repository/userRepo');

Page({
  data: {
    showingModal: "",
    currentTab: "board",
    navigationBarHeight: app.globalData.navigationBarHeight, // Safe area
    selectedGenderIndex: 0,

    pages: [{
        id: "board",
        title: "Board",
        icon: "../../images/ic_board.png",
        iconActive: "../../images/ic_board_active.png",
      },
      {
        id: "connection",
        title: "Connection",
        icon: "../../images/ic_connect.png",
        iconActive: "../../images/ic_connect_active.png",
      },
      {
        id: "user",
        title: "User",
        icon: "../../images/ic_user.png",
        iconActive: "../../images/ic_user_active.png",
      }
    ]
  },

  onTabSelect: function (e) {
    const currentTab = e.currentTarget.dataset.tabid;
    this.setData({
      currentTab
    });

    const { isSignup } = this.data;

    if ((currentTab === 'user' || currentTab === 'connection') && !app.globalData.userInfo && !isSignup) {
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
        icon: "../../images/ic_carpool.png",
        iconActive: "../../images/ic_carpool_active.png",
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