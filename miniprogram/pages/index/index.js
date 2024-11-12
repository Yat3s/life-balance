const app = getApp();
import { getAppConfig } from '../../repository/baseRepo';
import {
  fetchUserInfoOrSignup,
  fetchUserInfo,
} from '../../repository/userRepo';

Page({
  data: {
    showingModal: '',
    currentTab: 'board',
    navigationBarHeight: app.globalData.navigationBarHeight, // Safe area
    selectedGenderIndex: 0,

    pages: [
      {
        id: 'board',
        title: 'Board',
        icon: '../../images/ic_board.png',
        iconActive: '../../images/ic_board_active.png',
        isBeta: false,
      },
      {
        id: 'connection',
        title: 'Connection',
        icon: '../../images/ic_connect.png',
        iconActive: '../../images/ic_connect_active.png',
        isBeta: false,
      },
      {
        id: 'user',
        title: 'User',
        icon: '../../images/ic_user.png',
        iconActive: '../../images/ic_user_active.png',
        isBeta: false,
      },
    ],
  },

  onTabSelect(e) {
    const currentTab = e.currentTarget.dataset.tabid;
    this.setData({
      currentTab,
    });

    const { isSignup } = this.data;

    if (
      (currentTab === 'user' || currentTab === 'connection') &&
      !app.globalData.userInfo &&
      !isSignup
    ) {
      this.setData({
        isSignup: true,
      });
      fetchUserInfoOrSignup()
        .then((res) => {
          this.setData({
            isSignup: false,
          });
        })
        .catch((error) => {
          this.setData({
            isSignup: false,
          });
        });
    }
  },

  onLoad(options) {
    const { windowWidth, statusBarHeight } = app.globalData;
    this.setData({
      tabWidth: windowWidth / (this.data.pages.length + 1),
      statusBarHeight,
    });

    // Ensure the authentication
    fetchUserInfo().then((userInfo) => {
      if (userInfo) {
        app.globalData.userInfo = userInfo;
      }
    });

    // App Config
    getAppConfig().then((config) => {
      const { featureFlags } = config;
      const { pages } = this.data;

      const carpoolTabItem = {
        id: 'carpool',
        title: 'Carpool',
        icon: '../../images/ic_carpool.png',
        iconActive: '../../images/ic_carpool_active.png',
      };

      const mallTabItem = {
        id: 'mall',
        title: 'Mall',
        icon: '../../images/ic_mall.png',
        iconActive: '../../images/ic_mall_active.png',
        isBeta: true,
      };

      // Insert mall tab after board if enabled
      if (featureFlags.mallEnabled) {
        pages.splice(1, 0, mallTabItem);
      }

      // Insert carpool tab before connection if enabled
      if (featureFlags.carpoolEnabled) {
        const connectionIndex = pages.findIndex(
          (page) => page.id === 'connection'
        );
        pages.splice(connectionIndex, 0, carpoolTabItem);
      }

      this.setData({
        featureFlags,
        pages,
      });
    });
  },

  onShow() {
    if (app.globalData.pendingMessage) {
      wx.showToast({
        icon: 'none',
        duration: 3000,
        title: app.globalData.pendingMessage,
      });
      app.globalData.pendingMessage = null;
    }
  },
});
