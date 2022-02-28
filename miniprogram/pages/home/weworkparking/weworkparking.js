import {
  getAppConfig
} from "../../../repository/baseRepo";
import {
  cancelWeworkParkingBooking,
  fetchWeworkParkingBooking,
  signupWeworkParkingBooking
} from "../../../repository/dashboardRepo"
import {
  fetchUserInfo,
  updateUserInfo
} from "../../../repository/userRepo";

const bookingTodayStart = 9;
const bookingTodayEnd = 11;

// pages/home/weworkparking/weworkparking.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    bookingToday: false,
    bookingTodayNote: `注：当日 ${bookingTodayStart}:00 - ${bookingTodayEnd}:00 仅可预定其他组剩余车位。`,
    parkingRule: `在当日 ${bookingTodayEnd}:00 - 次日 ${bookingTodayStart}:00 可预定第二天组内剩余停车位，若组内停车位已满，则处于排队状态。
    • 当组内有人退出时，自动候补。
    • 当组内无人退出时，排队状态的小伙伴可在 ${bookingTodayStart}:00 - 次日 ${bookingTodayEnd}:00 时间段内预定其他组剩余车位。`
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

    let {
      bookingToday
    } = this.data;
    const now = new Date();
    if (now.getHours() >= bookingTodayStart && now.getHours() < bookingTodayEnd) {
      bookingToday = true;
    }

    const bookingTomorrowDate = now.getHours() < bookingTodayStart ? new Date() : new Date().addDays(1);
    const bookingTomorrowDateStr = (bookingTomorrowDate.getDate() == new Date().getDate() ? '今天 ' : '明天 ') + bookingTomorrowDate.mmdd();
    const bookingTomorrowAvailableDateStr = `${bookingTomorrowDate.addDays(-1).mmdd()} ${bookingTodayEnd}:00 - ${bookingTomorrowDate.mmdd()} ${bookingTodayStart}:00 `

    const bookingTodayDate = new Date();
    const bookingTodayDateStr = '今天 ' + bookingTodayDate.mmdd();
    const bookingTodayAvailableDateStr = `今天 ${bookingTodayStart}:00 - ${bookingTodayEnd}:00 `

    this.setData({
      bookingToday,
      bookingTomorrowDateStr,
      bookingTomorrowAvailableDateStr,
      bookingTodayDateStr,
      bookingTodayAvailableDateStr
    })

    this.bookingCountdown();

    fetchUserInfo().then(userInfo => {
      this.setData({
        userInfo,
      });

      getAppConfig().then(config => {
        const allowedOrgs = config.features.weworkParking.allowedOrgs;
        let userAllowed = false;
        for (const org of allowedOrgs) {
          if (org.name.toLowerCase() === userInfo.org.toLowerCase() && userInfo.alias && userInfo.vehicleId) {
            userAllowed = true;
          }
        }
        this.setData({
          allowedOrgs,
          userAllowed
        });

        this.fetchBooking();
      })
    });
  },

  bookingCountdown() {
    const { bookingToday } = this.data;
    const bookingTomorrowEndDate =  new Date().addDays(new Date().getHours() < bookingTodayEnd ? 0 : 1).setHours(bookingTodayStart)
    const countDownDate = bookingToday ? new Date().setHours(bookingTodayEnd, 0, 0) : bookingTomorrowEndDate;
    const x = setInterval(() => {
      // Get today's date and time
      var now = new Date().getTime();

      // Find the distance between now and the count down date
      var distance = countDownDate - now;

      if (distance <= 0) {
        clearInterval(x);
        this.bookingCountdown();
        this.onLoad();
        return;
      }

      // Time calculations for days, hours, minutes and seconds
      var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      var seconds = Math.floor((distance % (1000 * 60)) / 1000);
      this.setData({
        countdownStr: `${hours}小时${minutes}分钟${seconds}秒`
      })
    }, 1000);
  },

  fetchBooking() {
    const {
      userInfo,
      allowedOrgs,
      bookingToday,
    } = this.data;
    let joined = false;

    // Reset
    for (const org of allowedOrgs) {
      org.participants = [];
    }

    fetchWeworkParkingBooking().then(bookings => {

      const booking = new Date().getHours() <  bookingTodayEnd ? bookings[1] : bookings[0];
      const commonPool = {
        participants: [],
        maxParticipant: 0,
      }

      for (const participant of booking.participants) {
        participant.joinedAtStr = (new Date(participant.joinedAt)).hhmmss();
        if (userInfo._openid === participant._openid) {
          joined = true;
        }

        for (const org of allowedOrgs) {
          if (participant.org.toLowerCase() === org.name.toLowerCase()) {
            const participantJoinedDate = new Date(participant.joinedAt);
            const participantJoinedWithinTodayBooking = participantJoinedDate.getDate() == new Date().getDate() 
            && participantJoinedDate.getHours() >= bookingTodayStart 
            && participantJoinedDate.getHours() < bookingTodayEnd;

            if (bookingToday && (org.participants.length === org.maxParticipant || participantJoinedWithinTodayBooking)) {
              // Move pending partipants to common pool
              commonPool.participants.push(participant)
            } else {
              org.participants.push(participant)
            }
          }
        }
      }

      for (const org of allowedOrgs) {
        commonPool.maxParticipant += org.maxParticipant - org.participants.length
      }
      const bookingDateStr = (new Date(booking._createTime).addDays(1)).dateStr();
      this.setData({
        booking,
        commonPool,
        bookingDateStr,
        allowedOrgs,
        joined
      })
    });
  },

  onBookingClick() {
    const {
      booking,
      userInfo,
      bookingStarted,
      joined,
      userAllowed,
      bookingToday,
      commonPool,
    } = this.data;

    if (!userAllowed) {
      wx.showToast({
        icon: 'error',
        title: '用户车牌信息未注册',
      });

      return;
    }

    if (joined) {
      wx.showToast({
        icon: 'error',
        title: '请勿重复预定',
      });
      return;
    }

    if (bookingToday && commonPool.maxParticipant <= commonPool.participants.length) {
      wx.showToast({
        icon: 'error',
        title: '剩余车位为 0',
      });
      return;
    }

    userInfo.joinedAt = Date.now();
    this.setData({
      joined: true
    })
    signupWeworkParkingBooking(booking._id, userInfo).then(res => {
      wx.showToast({
        title: '预定成功',
      })
      this.fetchBooking();
    })
  },

  onCancelBookingClick() {
    const {
      booking,
    } = this.data;
    cancelWeworkParkingBooking(booking._id).then(res => {
      wx.showToast({
        title: '取消预定成功',
      });
      this.fetchBooking();
    })
  },

  onRuleClicked() {
    this.setData({
      showingModal: 'rule'
    })
  },

  onRefreshClicked() {
    this.fetchBooking()
  },

  onDismissModal() {
    this.setData({
      showingModal: ''
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