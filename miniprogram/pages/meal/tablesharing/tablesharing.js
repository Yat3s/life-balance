// pages/meal/tablesharing/tablesharing.js
import { fetchUserInfo } from "../../../repository/userRepo";

Page({

  /**
   * Page initial data
   */
  data: {
    userInfo:undefined,
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
      tableConfirmed:this.data.selecting
    })
    
    // re-select
    if (this.data.tableSelected) {
      this.setData({
        area: "",
        index: "",
        tableConfirmed: false,
      })
    }
    console.log(this.data.tableMap);
  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad(options) {
    fetchUserInfo().then(userInfo => {
      this.setData({
        userInfo
      })
    })
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
    var table = this.data.area+this.data.index;
    console.log("onShareAppMessage" + table)
    return {
      title: 'Canteen Table:' + table,
      path: '/pages/meal/tabledetail/tabledetail?area='+this.data.area+'&index='+this.data.index+'&user='+this.data.userInfo.nickName
    }
  },

  onTableConfirmed(e) {
    console.log("onTableConfirmed")
    this.setData({
      tableConfirmed:true,
      selecting: false
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
    })
  },
})