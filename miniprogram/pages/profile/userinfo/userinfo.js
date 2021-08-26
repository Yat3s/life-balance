// miniprogram/pages/profile/userinfo/userinfo.js
const userRepo = require('../../../repository/userRepo');

const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  onBirthdayPicked(e) {
    const birthday = e.detail.value;
    this.setData({
      birthday
    });
  },

  onHometownPicked(e) {
    const hometown = e.detail.value;
    this.setData({
      hometown
    });
  },

  onUserInfoSubmit(e) {
    const {
      height,
      school,
      desc
    } = e.detail.value;
    const {
      birthday,
      hometown
    } = this.data;

    const userInfo = { };

    if (height) {
      userInfo.height = height;
    }

    if (school) {
      userInfo.school = school;
    }

    if (birthday) {
      userInfo.birthday = birthday;
    }

    if (hometown) {
      userInfo.hometown = hometown.join("");
    }

    if (desc) {
      userInfo.desc = desc;
    }

    wx.showLoading();
    userRepo.updateUserInfo(app.globalData.userInfo._id, userInfo).then(res => {
      wx.hideLoading();
      wx.navigateBack({
        delta: 1,
      })
    });
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    userRepo.fetchUserInfoOrSignup().then(userInfo => {
      this.setData({
        birthday: userInfo.birthday,
        height: userInfo.height,
        hometown: userInfo.hometown,
        school: userInfo.school,
        desc: userInfo.desc
      })
    });
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