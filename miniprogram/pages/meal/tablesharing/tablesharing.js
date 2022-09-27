// pages/meal/tablesharing/tablesharing.js
import { fetchUserInfo } from "../../../repository/userRepo";
const { formatDate } = require("../../../common/util");

Page({

  /**
   * Page initial data
   */
  data: {
    imagePath: undefined,
    userInfo: undefined,
    tableConfirmed: false,
    selecting: false,
    area:"",
    index:"",
    areas:[],
    tableMap:{},
    tableCoords:{
      "A":{
        "11":["48.5","71"],"21":["48.5","107"],"31":["48.5","161"],"41":["48.5","198"],"12":["96.5","75"],"22":["96.5","101"],"32":["96.5","168"],"42":["96.5","193"],"23":["158","120"],"24":["194.5","120"],"25":["231","120"],"26":["266.5","120"],"33":["168.5","170"],"34":["222","170"],"35":["276","170"]},
      "B":{
        "11":["52","260"],"21":["52","306"],"31":["52","351"],"41":["52","395"],"12":["97.5","260"],"22":["97.5","306"],"32":["97.5","351"],"42":["97.5","395"],"13":["158","244"],"14":["190.5","244"],"15":["255","244"],"16":["285.5","244"],"23":["167","296"],"33":["167","331"],"24":["221","296"],"34":["221","331"],"25":["274.5","296"],"35":["274.5","331"],"43":["163","393"],"44":["220.5","393"],"45":["296","393"]},
      "C":{
        "11":["350","163"],"12":["381","163"],"13":["417","163"],"14":["453","163"],"21":["369.5","212"],"31":["369","238"],"22":["441","213"],"32":["441","238"],"23":["483.5","213"],"33":["483","238"],"41":["370","319"],"42":["463.5","319"],"51":["358","388"],"52":["398","388"],"53":["438","388"],"54":["478","388"]},
      "D":{
          "11":["557","167"],"12":["588","167"],"13":["625","167"],"14":["660","167"],"21":["553.5","234"],"22":["623.5","234"],"23":["667","234"],"31":["561.5","278"],"32":["623.5","278"],"33":["667","278"],"41":["550.5","344"],"42":["625","344"],"43":["666.5","344"],"51":["549.5","393"],"52":["625","390"],"53":["666.5","390"],"61":["593.5","370"]},
      "VIP":{
        "1": [750, 280], "2": [750, 380]}
   },
    map: {
      scale: 1,
      baseWidth: 814,
      baseHeight: 457,
      scaleWidth: 814,
      scaleHeight: 457
    }
  },

  scaleChange(e) {
    console.log(e)
    this.scale(e.detail.value)
  },

  scale(newScale) {
    let map = this.data.map
    let scaleWidth = newScale * map.baseWidth
    let scaleHeight = newScale * map.baseHeight

    this.setData({
      'map.scale': newScale,
      'map.scaleWidth': scaleWidth,
      'map.scaleHeight': scaleHeight,
    })

    console.log(this.data.map)
  },

  bindShowMsg() {
    if (this.data.fromUser)
    {
      console.log("this is a shared page")
      return
    }

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

    this.drawImage()
    this.scale(0.8)
  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad(options) {
    const coords = this.data.tableCoords
    const areas = Object.keys(coords)
    let tableMap = Object.create(null)
    areas.forEach(area => {
      const tableNumbers = Object.keys(coords[area])
      tableMap[area] = tableNumbers
    });
    console.log(tableMap)

    this.setData({
      areas : areas,
      tableMap : tableMap
    })

    fetchUserInfo().then(userInfo => {
      this.setData({
        userInfo
      })
    })

    const { user, area, index, time } = options;
    if (user && area && index) {
      this.setData({
        fromUser: user,
        area: area,
        index: index,
        date: time,

        tableConfirmed: true,
        selecting: false
      });

      this.drawImage(this.drawArrow)
    }
    else{
      this.drawImage()
    }

    this.scale(0.8)
  },

  onTableConfirmed(e) {
    console.log("onTableConfirmed")
    this.setData({
      tableConfirmed: true,
      selecting: false
    })
    this.drawArrow()
    this.scale(0.8)
  },

  drawImage(drawArrow) {
    // 通过 SelectorQuery 获取 Canvas 节点
    const map = this.data.map
    wx.createSelectorQuery()
      .select('#myCanvas')
      .fields({
        node: true,
        size: true,
      })
      .exec((res) => {
        console.log(res)
        console.log(this.data.imagePath)

        const width = map.baseWidth
        const height = map.baseHeight
        console.log("canvas width:" + width + "height: " + height)

        const canvas = res[0].node
        const ctx = canvas.getContext('2d')

        const dpr = wx.getSystemInfoSync().pixelRatio
        console.log("dpr: " + dpr)

        canvas.width = width * dpr
        canvas.height = height * dpr
        ctx.scale(dpr, dpr)

        const img = canvas.createImage()

        img.onload = (e) => {
          ctx.drawImage(img, 0, 0)
          console.log("drwa image")
          if (drawArrow != undefined) {
            drawArrow()
          }
        }

        const setImagePath = (path) => {
          this.setData({
            imagePath: path
          })

          console.log("this.data.imagePath:" + this.data.imagePath)
        }

        if (this.data.imagePath == undefined) {
          wx.getImageInfo({
            src: 'cloud://life-6go5gey72a61a773.6c69-life-6go5gey72a61a773-1259260883/app-assets/canteen-pics/Default.png',
            success: function (res) {
              img.src = res.path
              setImagePath(res.path)
            }
          })
        }
        else {
          img.src = this.data.imagePath
        }
      })
  },

  drawArrow() {
    const drawAarrowFunc = (context, fromx, fromy, tox, toy) => {
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
      context.lineWidth = 4
      context.stroke()
    };

    wx.createSelectorQuery()
      .select('#myCanvas')
      .fields({
        node: true,
        size: true,
      })
      .exec((res) => {
        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        const obj = this.data.tableCoords[this.data.area]

        let coords = obj[this.data.index]
        if (coords == undefined) {
          coords = [100, 100]
        }
        console.log(coords)
        console.log("draw arrow")
        drawAarrowFunc(ctx, 256, 0, coords[0], coords[1])
      })
  },

  onTablePickerChange(e) {
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
    var table = this.data.area + this.data.index;
    var now = new Date(Date.now());
    console.log("onShareAppMessage:" + table + ":" + now)
    return {
      title: 'Canteen Table:' + table,
      path: '/pages/meal/tablesharing/tablesharing?area=' + this.data.area + '&index=' + this.data.index + '&user=' + this.data.userInfo.nickName + '&time=' + formatDate(now)
    }
  }
})