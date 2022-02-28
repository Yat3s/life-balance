import {
  fetchFaq
} from "../../../repository/dashboardRepo"
import { fetchUserInfoOrSignup } from "../../../repository/userRepo";
import {
  navigateToAuth,
  navigateToHowToDeatil
} from "../../router";

const app = getApp();

// pages/home/howto/howto.js
Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  onItemClick(e) {
    const id = e.currentTarget.dataset.id;
    
    const userInfo = app.globalData.userInfo;
    if (userInfo && userInfo.company) {
      navigateToHowToDeatil(id);
      return;
    }

    wx.showLoading();
    fetchUserInfoOrSignup().then(user => {
      wx.hideLoading();
      if (user.company) {
        navigateToHowToDeatil(id);
      } else {
        navigateToAuth();
      }
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({
        icon: 'none',
        title: "Can't view in anonymously",
      })
    });
  },

  onSearchQas(e) {
    const word = e.detail.value.toLowerCase();
    const {
      qas
    } = this.data;
    for (const qa of qas) {
      const title = qa.title.toLowerCase();
      const tagStr = qa.tags.join(" ").toLowerCase();
      qa.show = title.search(word) != -1 || tagStr.search(word) != -1;
    }

    this.setData({
      qas
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.showLoading({
      title: 'Loading',
    });
    fetchFaq().then(qas => {
      wx.hideLoading();
      for (const qa of qas) {
        qa.show = true;
      }
      this.setData({
        qas
      })
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