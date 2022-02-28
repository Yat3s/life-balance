import { fetchWechatGroups } from "../../../repository/dashboardRepo"
import { fetchUserInfo } from "../../../repository/userRepo";
import { navigateToAuth } from "../../router";
const app = getApp();

const GROUP_CARD_BACKGROUNDS = ["#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF"];

Page({

  /**
   * 页面的初始数据
   */
  data: {
    botWechatId: 'i-coconut',
    appBarHeight: app.globalData.toolbarHeight + app.globalData.statusBarHeight,
    statusBarHeight: app.globalData.statusBarHeight,
    menu: app.globalData.menu,
  },

  onSearchGroup(e) {
    const word = e.detail.value.toLowerCase();
    const { groups } = this.data;
    for (const group of groups) {
      const name = group.name.toLowerCase();
      const code = group.code.toLowerCase();
      const city = group.citys ? group.citys.join(' ') : ''
      group.show = name.search(word) != -1 || code.search(word) != -1 || city.search(word) != -1;
    }

    this.setData({
      groups
    })
  },

  onOutsideTouch() {
    this.setData({
      showingModal: '',
    })
  },

  onDismissModal() {
    this.setData({
      showingModal: '',
    })
  },

  onGroupCardClick(e) {
    const group = e.currentTarget.dataset.group;
    this.setData({
      showingModal: 'groupCard',
      group
    })
  },

  onContactCopyClick(e) {
    this.copy(this.data.botWechatId)

    wx.showToast({
      icon: 'none',
      title: 'Wechat ID copied',
    });

    this.setData({
      showingModal: '',
    })
  },

  onCodeCopyClick() {
    const { userInfo, group } = this.data;

    if (!userInfo || !userInfo.company) {
      wx.showModal({
        title: 'Copy failed',
        content: "Please verify your company first.",
        success(res) {
          if (res.confirm) {
            navigateToAuth();
          } else if (res.cancel) {
            console.log('用户点击取消')
          }
        }
      })

      return;
    }

    this.copy(group.code)

    wx.showToast({
      icon: 'none',
      title: 'Group code copied',
    });

    this.setData({
      showingModal: '',
    })
  },

  copy(content) {
    wx.setClipboardData({
      data: content,
    });
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.showLoading({
      title: 'Loading groups',
    })
    fetchWechatGroups().then(groups => {
      wx.hideLoading();
      for (const idx in groups) {
        const group = groups[idx];
        group.background = GROUP_CARD_BACKGROUNDS[idx % GROUP_CARD_BACKGROUNDS.length]
        group.personIconCount = Math.ceil(group.memberCount / 100);
        group.show = true;
        group.codeFrist = group.code.substring(0, 3);
        group.codeSecond = group.code.substring(3);
        group.cityStr = group.citys ? group.citys.join('/') : '';
      }

      this.setData({
        groups
      })
    });

    fetchUserInfo().then(userInfo => {
      this.setData({
        userInfo
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