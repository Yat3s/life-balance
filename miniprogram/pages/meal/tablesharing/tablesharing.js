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
    tableMap1:{
      A: {"11": [45, 68], "12": [45, 68]},
      B: {"11": [45, 98], "12": [45, 68]},
      C: {"11": [45, 68], "12": [75, 168]},
      D: {"11": [55, 68], "12": [45, 68]},
      VIP:{"1": [600, 350], "2": [800, 400]}
    },
    touch: {
      scale: 1,
      baseWidth: 814,
      baseHeight: 457,
      scaleWidth: 814,
      scaleHeight: 457
    }
  },

  scaleUp: function(e) {
    if (this.data.touch.scale <= 2)
    {
      const newScale = this.data.touch.scale + 0.5
      this.scale(newScale)
    }
  },

  scaleDown: function(e) {
    if (this.data.touch.scale >= 1)
    {
      const newScale = this.data.touch.scale - 0.5
      this.scale(newScale)
    }
  },

  scaleChange(e) {
    console.log(e)
    this.scale(e.detail.value)
  },

  scale(newScale) {
    let touch = this.data.touch
    let scaleWidth = newScale * touch.baseWidth
    let scaleHeight = newScale * touch.baseHeight
    // 赋值 新的 => 旧的
    this.setData({
       //'touch.distance': distance,
       'touch.scale': newScale,
       'touch.scaleWidth': scaleWidth,
       'touch.scaleHeight': scaleHeight,
       //'touch.diff': distanceDiff
    })

    console.log(this.data.touch)
  },

  bindShowMsg() {
    this.setData({
      selecting: !this.data.selecting,
    })
    
    // re-select
    if (!this.data.tableConfirmed) {
      this.setData({
        area: "",
        index: "",
      })
    }

    if (this.data.selecting) {
      this.setData({
        area: "A",
        index: "11",
        tableConfirmed: false,
      })
    }

    console.log(this.data.tableMap)
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
        }

        //ctx.save()

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
      context.endPath()
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

      const canvas = res[0].node
      const ctx = canvas.getContext('2d')
      const obj = this.data.tableMap1[this.data.area]
      console.log(obj)
      const cords = obj[this.data.index]
      console.log(cords)
      drawAarrow(ctx, 256, 0, cords[0], cords[1])
    })

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