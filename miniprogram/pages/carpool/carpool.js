// pages/carpool/carpool.js
const { navigateToPostCarpool, navigateToAuth } = require("../router");
const { fetchAllCarpools } = require("../../repository/carpoolRepo");
const { fetchUserInfoOrSignup } = require("../../repository/userRepo");
const app = getApp();

Component({
  options: {
    addGlobalClass: true,
  },
  /**
   * 组件的属性列表
   */
  properties: {},

  /**
   * 组件的初始数据
   */
  data: {
    toolbarHeight: app.globalData.toolbarHeight,
  },

  pageLifetimes: {
    show() {
      // Refresh data
      if (this.data.carpools) {
        this.fetchCarpools();
      }
    },
  },

  lifetimes: {
    attached() {
      wx.reportEvent("carpoolpageload", {});
      this.fetchCarpools();
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    toPostCarpool() {
      const userInfo = app.globalData.userInfo;
      if (userInfo && userInfo.company) {
        navigateToPostCarpool();
        return;
      }

      wx.showLoading();
      fetchUserInfoOrSignup()
        .then((user) => {
          wx.hideLoading();
          if (user.company) {
            navigateToPostCarpool();
          } else {
            navigateToAuth();
          }
        })
        .catch((err) => {
          wx.hideLoading();
          wx.showToast({
            icon: "none",
            title: "Can't post in anonymously",
          });
        });
    },

    fetchCarpools() {
      fetchAllCarpools().then((carpools) => {
        this.setData(
          {
            carpools,
          },
          this.checkContentEmpty
        );
      });
    },

    checkContentEmpty() {
      wx.createSelectorQuery()
        .in(this)
        .select("#carpoolContainer")
        .boundingClientRect((rect) => {
          if (!rect) {
            return;
          }
          const isEmpty = rect.height <= 0;
          const { showEmptyMessage } = this.data;
          if (isEmpty != showEmptyMessage) {
            this.setData({
              showEmptyMessage: isEmpty,
            });
          }
        })
        .exec();
    },
  },
});
