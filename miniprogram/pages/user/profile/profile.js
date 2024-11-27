const { formatDate } = require("../../../common/util");
const {
  fetchUserActivities,
  fetchUserGroups,
} = require("../../../repository/activityRepo");
const { fetchUserProfile } = require("../../../repository/userRepo");
const { navigateToGroupDetail, navigateToGroup } = require("../../router");

// pages/user/profile/profile.js
Page({
  /**
   * 页面的初始数据
   */
  data: {},

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const id = options.id;
    fetchUserProfile(id).then((user) => {
      console.log(user);
      if (user.birthday) {
        user.age =
          new Date().getFullYear() - parseInt(user.birthday.slice(0, 4));
        console.log(parseInt(user.birthday.slice(0, 4)));
      }
      this.setData({
        user,
      });
    });

    fetchUserActivities(id).then((activities) => {
      console.log("fetchUserActivities", activities);
      activities.forEach((activity) => {
        activity.isOrganizer = activity.organizer._id === id;
        activity.createDateStr = formatDate(activity._createTime);
      });
      this.setData({
        activities,
      });
    });
  },

  onGroupClick(e) {
    navigateToGroupDetail(e.currentTarget.dataset.id);
  },

  onAllGroupClick(e) {
    navigateToGroup();
  },

  onPhotoClick(e) {
    const { user } = this.data;
    const urls = [];
    if (user.photos && user.photos.length > 0) {
      urls.push(...user.photos);
    } else {
      urls.push(user.avatarUrl);
    }

    wx.previewImage({
      urls,
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {},

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {},

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {},

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {},

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {},

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {},

  onShareTimeline() {},
});
