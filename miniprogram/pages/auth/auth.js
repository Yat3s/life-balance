// miniprogram/pages/auth/auth.js
const userRepo = require('../../repository/userRepo');
const router = require('../router');

Page({

  /**
   * 页面的初始数据
   */
  data: {

  },
  getPhoneNumber(e) {
    wx.showLoading();
    userRepo.fetchUserInfoOrSignup().then(userInfo => {
      const phoneNumberCloudId = e.detail.cloudID;
      
      userRepo.updatePhoneNumber(userInfo._id, phoneNumberCloudId).then(res => {
        wx.hideLoading();

        const { origin } = this.data;
        if (origin == router.AUTH_ORIGIN_DRAFT_ACTIVITY) {
          router.navigateToDraftActivity();
        } else {
          wx.navigateBack({
            delta: 0,
          })
        }
      }).catch(err => {
        console.log(err);
      })
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const origin = options.origin;
    this.setData({
      origin
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