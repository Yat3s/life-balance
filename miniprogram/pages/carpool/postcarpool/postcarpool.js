const {
  calcDistance, subscribeNotification
} = require("../../../common/util");

const { postCarpoolRequest } = require("../../../repository/carpoolRepo");
const { subscribeCarpoolNotification } = require("../../../repository/notificationHelper");
const { fetchUserInfo } = require("../../../repository/userRepo");
const app = getApp();
const MAX_SEATS = 6;
const FEE_PER_KM = 1.25;

Page({

  /**
   * 页面的初始数据
   */
  data: {
    paymentMethod: 'shareGas',
    seatCount: 1,
  },

  onSubmit() {
    const {
      locationFrom,
      locationTo,
      startDateStr,
      startTimeStr,
      seatCount,
      hostType,
      paymentMethod,
      shareGasFee,
      exactFee,
      comment,
      userInfo,
      distance,
      contact
    } = this.data;

    if (!locationFrom || !locationTo) {
      wx.showToast({
        icon: 'none',
        title: "So where are you going?",
      });

      return;
    }

    if (locationFrom.address === locationTo.address) {
      wx.showToast({
        icon: 'none',
        title: "Do you plan to spin around?",
      });

      return;
    }

    const startDate = Date.parse((startDateStr + " " + startTimeStr).replace(/-/g, "/"));
    if (startDate <= Date.now()) {
      wx.showToast({
        icon: 'none',
        title: `${startTimeStr} may be too late.`
      });

      return;
    }

    const fee = paymentMethod === 'shareGas' ? shareGasFee : exactFee

    const participants = [];
    if (hostType === 'driver') {
      participants.push(userInfo);
    }

    const carpool = {
      _createTime: Date.now(),
      startDate,
      locationFrom,
      locationTo,
      seatCount: hostType === 'driver' ? seatCount + 1 : seatCount,
      hostType,
      paymentMethod,
      comment,
      fee,
      contact,
      participants,
      distance,
      host: userInfo
    };

    wx.showLoading();
    postCarpoolRequest(carpool).then(res => {
      app.globalData.pendingMessage = 'Post success!';

      wx.hideLoading();
      subscribeCarpoolNotification();
    }).catch(err => {
      wx.hideLoading();
      app.globalData.pendingMessage = 'Post failed!';
      wx.showToast({
        icon: 'error',
        title: `Post failed, ${err}`
      });
    })
  },

  onHostTypeSelected(e) {
    const hostType = e.currentTarget.dataset.type;
    this.hostTypeSelected(hostType);
  },

  hostTypeSelected(hostType) {
    const seatCountTitle = hostType === 'driver' ? 'How many seats do you want to share' : 'How many seats do you want'
    const commentTitle = hostType === 'driver' ? 'Leave message to passengers' : 'Leave message to driver'

    this.setData({
      hostType,
      seatCountTitle,
      commentTitle
    });
  },

  onSeatIncrease() {
    let {
      seatCount
    } = this.data;

    if (seatCount >= MAX_SEATS) {
      wx.showToast({
        icon: 'error',
        title: `The max is ${MAX_SEATS}`,
      });

      return;
    }

    seatCount++;
    this.setData({
      seatCount
    });

    this.calcGasSharingFee();
  },

  onSeatDecrease() {
    let {
      seatCount
    } = this.data;

    if (seatCount <= 1) {
      return;
    }

    seatCount--;
    this.setData({
      seatCount
    });

    this.calcGasSharingFee();
  },

  calcGasSharingFee() {
    let {
      distance,
      seatCount
    } = this.data;
    distance = distance || 0;
    const fee = parseFloat(((FEE_PER_KM * distance) / (seatCount + 1)).toFixed(2));
    const shareGasEstimatePriceStr = `¥${fee} CNY/Seat (${distance}km * ${FEE_PER_KM} / ${seatCount + 1} seats)`;
    this.setData({
      shareGasEstimatePriceStr,
      shareGasFee: fee,
    })
  },

  onChooseLocation(e) {
    const type = e.currentTarget.dataset.type;
    wx.chooseLocation().then(res => {
      if (!res.name && !res.address) {
        return;
      }
      if (type == 'from') {
        this.setData({
          locationFrom: res
        });
      } else {
        this.setData({
          locationTo: res
        });
      }

      // Calc distance
      const {
        locationFrom,
        locationTo
      } = this.data;

      if (locationFrom && locationTo) {
        const distance = calcDistance(locationFrom.latitude, locationFrom.longitude, locationTo.latitude, locationTo.longitude);
        this.setData({
          distance
        });
        this.calcGasSharingFee();
      }
    })
  },

  onStartDatePicked(e) {
    const startDateStr = e.detail.value;
    this.setData({
      startDateStr
    })
  },

  onStartTimePicked(e) {
    const startTimeStr = e.detail.value;
    this.setData({
      startTimeStr
    })
  },

  onChoosePaymentMethod(e) {
    const paymentMethod = e.currentTarget.dataset.method;
    this.setData({
      paymentMethod
    });
  },

  onExactlyPriceInput(e) {
    const exactFee = parseFloat(parseFloat(e.detail.value || 0).toFixed(2));
    this.setData({
      exactFee
    })
  },

  onComment(e) {
    this.setData({
      comment: e.detail.value
    })
  },

  onContactInput(e) {
    this.setData({
      contact: e.detail.value
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const now = new Date();
    const startDateStr = now.yyyymmdd();

    const hour = now.getHours() >= 23 ? 0 : now.getHours() + 1;
    const startTimeStr = `${hour}:00`;

    this.setData({
      startDateStr,
      startTimeStr,
    });
    this.hostTypeSelected('driver');
    this.calcGasSharingFee();

    fetchUserInfo().then(userInfo => {
      this.setData({
        userInfo
      })
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})