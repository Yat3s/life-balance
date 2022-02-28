// pages/user/useractivity/useractivity.js
const app = getApp();
const activityRepo = require('../../../repository/activityRepo');
const userRepo = require('../../../repository/userRepo');
const router = require('../../router');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    windowWidth: app.globalData.windowWidth,
    selectedTabId: 'all',
    organizeCount: 0,
    showEmpty: true,
    tabs: [{
        id: 'all',
        name: "All activities",
        count: 0,
      },
      {
        id: 'organizer',
        name: "Posted activities",
        count: 0,
      },

      {
        id: 'like',
        name: "Liked activities",
        count: 0,
      },
    ]
  },
  onTabSelected(e) {
    const selectedTabId = e.currentTarget.dataset.id;
    const {
      activities,
      likedActivities
    } = this.data;

    let showEmpty = false;
    switch (selectedTabId) {
      case 'all':
        showEmpty = !activities || activities.length == 0;
        break;

      case 'organizer':
        let count = 0;
        activities.forEach(activity => {
          if (activity.type == 'organizer') {
            count++;
          }
        })
        showEmpty = count == 0;
        break;

      case 'like':
        showEmpty = !likedActivities || likedActivities.length == 0;
        break;
    }

    this.setData({
      selectedTabId,
      showEmpty,
    });
  },

  fetchAllLikedActivities(ids) {
    if (!ids) {
      return;
    }

    activityRepo.fetchActivitiesByIds(ids).then(likedActivities => {
      this.setData({
        likedActivities
      });

      this.updateTabCount('like', likedActivities.length);
    })
  },

  fetchAllPersonalActivities(openid) {
    activityRepo.fetchAllPersonalActivities().then(activities => {
      console.log(activities);
      let organizeCount = 0;
      activities.forEach(activity => {
        if (activity.organizer._openid == openid) {
          activity.type = 'organizer';
          organizeCount++;
        }
      });

      this.setData({
        activities,
        showEmpty: activities.length == 0
      });

      this.updateTabCount('organizer', organizeCount);
      this.updateTabCount('all', activities.length);
    })
  },

  updateTabCount(tabId, count) {
    const {
      tabs
    } = this.data;
    for (const tab of tabs) {
      if (tab.id == tabId) {
        tab.count = count;
        break;
      }
    }

    this.setData({
      tabs
    });
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    userRepo.fetchUserInfo().then(userInfo => {
      if (!userInfo) {
        return;
      }

      this.setData({
        userInfo
      });

      this.fetchAllPersonalActivities(userInfo._openid);
      this.fetchAllLikedActivities(userInfo.likes);
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})