// pages/canteen/tablesharing.js
Page({

  /**
   * Page initial data
   */
  data: {
    select: false,
    table:"请选择",
    tables:[
      "A11",
      "A12",
      "B12",
      "B13"
    ],
  },

  bindShowMsg() {
    this.setData({
      select: !this.data.select,
    })
    if (this.data.table != "请选择"){
      this.setData({
        table: "请选择"
      })
    }
  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad(options) {

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

  },

  onTableSelect(e) {
    console.log(e)
    var name = e.currentTarget.dataset.name
    this.setData({
      table: name,
      select: false
    })
  }
})