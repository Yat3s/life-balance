// pages/canteen/tablesharing.js

const {
  navigateToCanteenTableDetail,
} = require("../router");

Page({

  /**
   * Page initial data
   */
  data: {
    selected:false,
    selecting: false,
    table:"请选择",
    tables:[
      "A11",
      "A12",
      "B12",
      "B13"
    ]
  },

  bindShowMsg() {
    this.setData({
      selecting: !this.data.selecting,
    })
    // re-select
    if (this.data.selected){
      this.setData({
        table: "请选择",
        selected: false
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

    return {
      title: 'Canteen Table:' + this.data.table,
      path: '/pages/canteen/tabledetail/tabledetail?table='+this.data.table
    }
  },

  onTableSelected(e) {
    console.log(e)
    var name = e.currentTarget.dataset.name
    this.setData({
      table: name,
      selected: true,
      selecting: false
    })
  }
})