// pages/meal/tablesharing/tablesharing.js
import { fetchUserInfo } from "../../../repository/userRepo";
const { formatDate } = require("../../../common/util");

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
      scale    },
    touch: {
      distance: 0,
      scale: 1,
      baseWidth: null,
      baseHeight: null,
      scaleWidth: null,
      scaleHeight: null
    }
  },

  touchstartCallback: function(e) {
    // 单手指缩放开始，也不做任何处理
    if(e.touches.length == 1) return
    console.log('双手指触发开始')
    // 注意touchstartCallback 真正代码的开始
    // 一开始我并没有这个回调函数，会出现缩小的时候有瞬间被放大过程的bug
    // 当两根手指放上去的时候，就将distance 初始化。
    let xMove = e.touches[1].clientX - e.touches[0].clientX;
    let yMove = e.touches[1].clientY - e.touches[0].clientY;
    let distance = Math.sqrt(xMove * xMove + yMove * yMove);
    this.setData({
       'touch.distance': distance,
    })
  },

  touchmoveCallback: function(e) {
    let touch = this.data.touch
    // 单手指缩放我们不做任何操作
    if(e.touches.length == 1) return
    console.log('双手指运动')
    let xMove = e.touches[1].clientX - e.touches[0].clientX;
    let yMove = e.touches[1].clientY - e.touches[0].clientY;
    // 新的 ditance
    let distance = Math.sqrt(xMove * xMove + yMove * yMove);
    let distanceDiff = distance - touch.distance;
    let newScale = touch.scale + 0.005 * distanceDiff
    // 为了防止缩放得太大，所以scale需要限制，同理最小值也是
    if(newScale >= 3) {
        newScale = 3
    }
    if(newScale <= 0.4) {
        newScale = 0.4
    }
    let scaleWidth = newScale * touch.baseWidth
    let scaleHeight = newScale * touch.baseHeight
    // 赋值 新的 => 旧的
    this.setData({
       'touch.distance': distance,
       'touch.scale': newScale,
       'touch.scaleWidth': scaleWidth,
       'touch.scaleHeight': scaleHeight,
       'touch.diff': distanceDiff
    })
  },

  bindload: function(e) {
    // bindload 这个api是<image>组件的api类似<img>的onload属性
    this.setData({
        'touch.baseWidth': e.detail.width,
        'touch.baseHeight': e.detail.height,
        'touch.scaleWidth': e.detail.width,
        'touch.scaleHeight': e.detail.height
    })
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
    var now = new Date(Date.now());
    console.log("onShareAppMessage:" + table + ":" + now)
    return {
      title: 'Canteen Table:' + table,
      path: '/pages/meal/tabledetail/tabledetail?area='+this.data.area+'&index='+this.data.index+'&user='+this.data.userInfo.nickName+'&gender='+this.data.userInfo.gender+'&time='+formatDate(now)
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

    let { areas, tableMap } = this.data;
    var area = areas[val[0]];
    var index = tableMap[area][val[1]];
    console.log(area + index)

    this.setData({
      area,
      index,
      selecting: true,
    })
  },
})