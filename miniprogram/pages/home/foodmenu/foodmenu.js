import { fetchFoodMenus } from "../../../repository/dashboardRepo";

// pages/home/foodmenu/foodmenu.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    selectedDateIndex: 0,
    selected: "b25",
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    fetchFoodMenus("b25").then((menus) => {
      const b25Menu = this.processMenuData(menus);
      console.log("b25", b25Menu);
      this.setData({
        b25Menu,
      });
    });

    fetchFoodMenus("zhongmeng").then((menus) => {
      const zhongmengMenu = this.processMenuData(menus);
      console.log("zhongmeng", zhongmengMenu);
      this.setData({
        zhongmengMenu,
      });
    });
  },

  processMenuData(menus) {
    if (menus && menus.length > 0) {
      const menu = menus[0];
      var nodes = menu.menuContent;

      // Move all images in to imgs
      if (nodes.indexOf("src") >= 0) {
        var imgs = [];
        nodes = nodes.replace(
          /<img [^>]*src=['"]([^'"]+)[^>]*>/gi,
          function (match, capture) {
            imgs.push(capture);
            menu.imgs = imgs;
            return "";
          }
        );

        console.log("img", imgs);
        nodes = nodes.replace(
          /<p(([\s\S])*&#63;)<\/p>/g,
          function (match, capture) {
            return "";
          }
        );

        menu.menuContent = nodes;
      }
      return menu;
    }
  },

  onMenuClick(e) {
    const selected = e.currentTarget.dataset.selected;
    this.setData({
      selected,
    });
  },

  previewImage(e) {
    wx.previewImage({
      urls: [e.currentTarget.dataset.src],
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
  onShareAppMessage: function () {},

  onShareTimeline: function () {},
});
