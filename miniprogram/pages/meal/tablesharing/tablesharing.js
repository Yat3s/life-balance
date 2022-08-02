// pages/meal/tablesharing/tablesharing.js

Page({

  /**
   * Page initial data
   */
  data: {
    areaSelected: true,
    tableSelected: true,
    tableConfirmed: false,
    selecting: true,
    area:"A",
    index:"11",
    areas:["A", "B", "C", "D", "VIP"],
    tableMap:{
      A: [11, 12, 21, 22, 23, 24, 25, 26, 31, 32, 33, 34, 35, 41, 42],
      B: [11, 12, 13, 14, 15, 16, 21, 22, 23, 24, 25, 31, 32, 33, 34, 35, 41, 42, 43, 44, 45],
      C: [11, 12, 13, 14, 21, 22, 23, 31, 32, 33, 41, 42, 51, 52, 53, 54],
      D: [11, 12, 13, 14, 21, 22, 23, 31, 32, 33, 41, 42, 43, 51, 52, 53, 61],
      VIP: [1, 2]
    }
  },

  bindShowMsg() {
    if (this.data.selecting) {
      wx.setBackgroundColor({
        backgroundColor:"#F5F5F5"
      })
    }

    this.setData({
      selecting: !this.data.selecting,
    })
    
    // re-select
    if (this.data.tableSelected) {
      this.setData({
        area: "",
        index: "",
        areaSelected: false,
        tableSelected: false,
        tableConfirmed: false,
      })
    }
    console.log(this.data.tableMap);
    console.log(this.data.tableSelected);
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
  onShareAppMessage(e) {
    console.log("onShareAppMessage" + e)
    return {
      title: 'Canteen Table:' + this.data.table,
      path: '/pages/meal/tabledetail/tabledetail?table='+this.data.area+this.data.index
    }
  },

  onTableSelected(e) {
    console.log("onTableSelected")
    var name = e.currentTarget.dataset.name
  
    this.setData({
      index:name,
      selecting: true,
      areaSelected: true,
      tableSelected: true,
      tableConfirmed: false,
    })
  },

  onTableConfirmed(e) {
    console.log("onTableConfirmed")
    this.setData({
      tableConfirmed:true,
      selecting: false,
      areaSelected: false,
      tableSelected: false,
      tableConfirmed: true
    })
  },

  onTablePickerChange(e)
  {
    var val = e.detail.value;
    var area = this.data.areas[val[0]];
    var index = this.data.tableMap[area][val[1]];
    console.log(area+index)
    this.setData({
      area: area,
      index: index,
      selecting: true,
      areaSelected: true,
      tableSelected: true,
    })
  },

  onAreaSelected(e) {
    console.log("onAreaSelected")
    this.setData({
      area:e.currentTarget.dataset.name,
      index:"",
      selecting: true,
      areaSelected: true,
      tableSelected: false,
      tableConfirmed:false,
    })
  }
})