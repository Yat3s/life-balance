// pages/meal/tabledetail/tabledetail.js
Page({

  /**
   * Page initial data
   */
  data: {
    area:'',
    index:'',
    user:'',
    date:undefined,
  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad(options) {
    var now = new Date(Date.now());
    console.log(options);
    this.setData({
      user:options.user,
      area:options.area,
      index:options.index,
      date:now.toLocaleDateString()+" "+ now.toLocaleTimeString(),
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