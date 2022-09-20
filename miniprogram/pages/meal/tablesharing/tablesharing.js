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
    },
    touch: {
      distance: 0,
      scale: 1,
      baseWidth: 814,
      baseHeight: 457,
      scaleWidth: 814,
      scaleHeight: 457
    }
  },

  touchstartCallback: function(e) {
    // 单手指缩放开始，也不做任何处理
    if(e.touches.length == 1) return
    console.log('双手指触发开始' + e)
    console.log(e)
    // 注意touchstartCallback 真正代码的开始
    // 一开始我并没有这个回调函数，会出现缩小的时候有瞬间被放大过程的bug
    // 当两根手指放上去的时候，就将distance 初始化。
    let xMove = e.touches[1].x - e.touches[0].x;
    let yMove = e.touches[1].y - e.touches[0].y;
    let distance = Math.sqrt(xMove * xMove + yMove * yMove);
    this.setData({
       'touch.distance': distance,
    })

    console.log("distance:"+this.data.touch.distance);
  },

  touchmoveCallback: function(e) {
    let touch = this.data.touch
    // 单手指缩放我们不做任何操作
    if(e.touches.length == 1) return
    console.log('双手指运动' + e)
    console.log(e)
    let xMove = e.touches[1].x - e.touches[0].x;
    let yMove = e.touches[1].y - e.touches[0].y;
 
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

    console.log("X: " + xMove + " Y: " + yMove + " distance: " + distance + " newScale: " + newScale);

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

    console.log(this.data.touch);
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

    const drawAarrow = (context, fromx, fromy, tox, toy) => {
        var headlen = 10; // length of head in pixels
        var dx = tox - fromx;
        var dy = toy - fromy;
        var angle = Math.atan2(dy, dx);

        context.beginPath()
        context.moveTo(fromx, fromy);
        context.lineTo(tox, toy);
        context.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
        context.moveTo(tox, toy);
        context.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
        context.strokeStyle = "red"
        context.lineWidth = 3
        context.stroke();
    };

    // 通过 SelectorQuery 获取 Canvas 节点
    wx.createSelectorQuery()
      .select('#myCanvas')
      .fields({
        node: true,
        size: true,
      })
      .exec((res) => {
        console.log(res)
        const width = res[0].width
        const height = res[0].height
    
        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
    
        const dpr = wx.getSystemInfoSync().pixelRatio
        canvas.width = width * dpr
        canvas.height = height * dpr
        ctx.scale(dpr, dpr)
    
        const img = canvas.createImage()

        img.onload = (e) => {
            console.log(ctx)
            ctx.drawImage(img, 0, 0)
            drawAarrow(ctx, 256, 0, 45, 68)
        }

        wx.getImageInfo({
            src: 'cloud://life-6go5gey72a61a773.6c69-life-6go5gey72a61a773-1259260883/app-assets/canteen-pics/Default.png',
            success: function(res) {
                console.log(res)
                img.src = res.path
            }
          })

        console.log(img.src)
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