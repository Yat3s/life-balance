// pages/meal/tabledetail/tabledetail.js
Page({

  /**
   * Page initial data
   */

  /**
   * Lifecycle function--Called when page load
   */
  onLoad(options) {
    console.log(options);
    const { user, area, index, time } = options;
    this.setData({
      user:user,
      area:area,
      index:index,
      date:time,
    });
  },

  /**
   * Lifecycle function--Called when page is initially rendered
   */
  onReady() {

  },

  /**
   * Lifecycle function--Called when page show
   */
  onShow() {

  },

  /**
   * Lifecycle function--Called when page hide
   */
  onHide() {

  },

  /**
   * Lifecycle function--Called when page unload
   */
  onUnload() {

  },

  /**
   * Page event handler function--Called when user drop down
   */
  onPullDownRefresh() {

  },

  /**
   * Called when page reach bottom
   */
  onReachBottom() {

  },

  /**
   * Called when user click on the top right corner to share
   */
  onShareAppMessage() {

  }
})