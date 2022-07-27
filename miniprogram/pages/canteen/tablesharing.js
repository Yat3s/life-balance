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
      "A11","A12","A21","A22","A23","A24","A25","A26","A31","A32","A33","A34","A35","A41","A42","B11","B12","B13","B14","B15","B16","B21","B22","B23","B24","B25","B31","B32","B33","B34","B35","B41","B42","B43","B44","B45","C11","C12","C13","C14","C21","C22","C23","C31","C32","C33","C41","C42","C51","C52","C53","C54","D11","D12","D13","D14","D21","D22","D23","D31","D32","D33","D41","D42","D43","D51","D52","D53","D61"
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