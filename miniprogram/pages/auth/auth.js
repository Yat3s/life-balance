// miniprogram/pages/auth/auth.js
const userRepo = require('../../repository/userRepo');
const router = require('../router');
const app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    step: 0,
  },

  onCopy(e) {
    const content = e.currentTarget.dataset.content;
    wx.setClipboardData({
      data: content,
    })

    wx.showToast({
      icon: 'none',
      title: 'Copied to clipboard',
    })
  },

  onCompanySelected(e) {
    const {
      userInfo
    } = this.data;
    const selectedCompanyId = e.detail.value;
    this.setData({
      step: 2
    });

    const verifyInfo = `${userInfo._openid}@${selectedCompanyId}`;
    const verifyLink = `https://teams.microsoft.com/l/chat/0/0?users=zhiye@microsoft.com&message=${verifyInfo}`;

    this.setData({
      verifyInfo, 
      verifyLink
    })
  },

  onCompanyAuth(e) {
    wx.showLoading();
    userRepo.fetchUserInfoOrSignup().then(userInfo => {
      wx.hideLoading();
      this.setData({
        step: 1,
        userInfo
      })
      this.fetchCompanyList();
  
      setTimeout(() => {
        this.setData({
          showChooseCompany: true
        })
      }, 800);
  
    }).catch(err => {
      wx.hideLoading();

      wx.showToast({
        duration: 1000,
        icon: 'error',
        title: "授权失败" + err,
      })
    })
  },

  fetchCompanyList() {
    userRepo.fetchCompanies().then(companies => {
      this.setData({
        companies
      })
    })
  },

  onContactInput(e) {
    const contact = e.detail.value;
    this.setData({
      contact
    })
  },

  onSubmit() {
    const { contact, userInfo } = this.data;
    if (!contact || contact.length == 0) {
      wx.showToast({
        icon: 'none',
        title: 'Please setting contact information',
      });

      return;
    }

    const updateData = {
      contact
    }
    userRepo.updateUserInfo(userInfo._id, updateData).then(res => {
      app.globalData.pendingMessage = 'Submit success, please waiting for approval!'
      wx.navigateBack({
        delta: 1,
      });
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