// miniprogram/pages/activity/activitydetail/activitydetail.js
const activityRepo = require('../../../repository/activityRepo');
const userRepo = require('../../../repository/userRepo');

const util = require('../../../common/util');
const router = require('../../router');

const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    toolbarHeight: app.globalData.toolbarHeight,
    statusBarHeight: app.globalData.statusBarHeight,
    canEdit: false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.fetchActivity(options.id);
  },

  retrieveLocation() {
    wx.getLocation({
      type: 'wgs84'
    }).then(res => {
      this.setData({
        latitude: res.latitude,
        longitude: res.longitude
      });

      this.calcDistance();
    });
  },

  calcDistance() {
    const {
      activity,
      latitude,
      longitude
    } = this.data;

    if (!activity || !latitude) {
      return;
    }

    if (activity.location && activity.location.latitude) {
      const distance = util.distance(activity.location.latitude, activity.location.longitude, latitude, longitude);
      activity.distance = distance;
      activity.distanceStr = `(${distance}km)`;
    }

    this.setData({
      activity
    });
  },

  fetchUserInfo() {
    userRepo.fetchUserInfo().then(userInfo => {
      if (!userInfo) {
        return;
      }

      const {
        activity
      } = this.data;

      // Join state
      let joined = false;

      for (const participant of activity.participants) {
        if (participant._openid == userInfo._openid) {
          joined = true;
          break;
        }
      }

      // Like state
      let liked = false;
      if (userInfo.likes) {
        for (const activityId of userInfo.likes) {
          if (activityId == activity._id) {
            liked = true;
            break;
          }
        }
      }

      const ended = Date.now() > activity.endDate;
      const canEdit = userInfo._openid == activity.organizer._openid && !ended;

      this.setData({
        userInfo,
        joined,
        liked,
        canEdit,
        ended,
      });
    })
  },

  fetchActivity(id) {
    wx.showLoading();
    activityRepo.fetchActivityItem(id).then(activity => {
      wx.hideLoading();
      let participantMale = 0;
      let participantFemale = 0;

      for (const participant of activity.participants) {
        if (participant.gender == 1) {
          participantMale++;
        }
      }
      participantFemale = activity.participants.length - participantMale;

      const participantMaleProgress = participantMale == 0 ? 0 : Math.max(20, parseInt(participantMale / activity.maxParticipantMale * 100));
      const participantFemaleProgress = participantFemale == 0 ? 0 : Math.max(20, parseInt(participantFemale / activity.maxParticipantFemale * 100));
      const maxParticipantMalePercent = parseInt(activity.maxParticipantMale / activity.maxParticipant * 100);
      const maxParticipantFemalePercent = parseInt(activity.maxParticipantFemale / activity.maxParticipant * 100);

      this.setData({
        activity,
        participantMale,
        participantMaleProgress,
        participantFemale,
        participantFemaleProgress,
        maxParticipantMalePercent,
        maxParticipantFemalePercent
      });


      this.fetchUserInfo();
      this.retrieveLocation();
    }).catch(err => {
      wx.hideLoading();
    });
  },

  back() {
    const pages = getCurrentPages();
    console.log(pages);
    if (pages.length == 1) {
      wx.reLaunch({
        url: '/pages/index/index',
      })
    } else {
      wx.navigateBack({
        delta: 1,
      })
    }
  },

  onClickLocation() {
    const { activity } = this.data;

    const location = activity.location;
    if (!location || !location.latitude) {
      return;
    }
    wx.openLocation({
      latitude: location.latitude,
      longitude: location.longitude,
      name: location.name,
      address: location.address
    })
  },

  showQrcodeModal() {
    const {
      joined,
      activity
    } = this.data;

    if (!joined) {
      wx.showToast({
        icon: 'none',
        title: '请先报名参加活动',
      });

      return;
    }

    if (!activity.qrcode) {
      wx.showToast({
        icon: 'none',
        title: 'Oops, 管理员还未设置微信群二维码',
      });

      return;
    }


    this.setData({
      showQrcode: true
    });
  },

  hideQrcodeModal() {
    this.setData({
      showQrcode: false
    });
  },

  saveQrcodeToAlbum() {
    wx.showLoading();
    wx.cloud.downloadFile({
      fileID: this.data.activity.qrcode
    }).then(res => {
      console.log(res);
      wx.hideLoading();
      wx.saveImageToPhotosAlbum({
        filePath: res.tempFilePath,
      }).then(data => {
        wx.showToast({
          title: '保存成功',
        })
      })
    })
  },

  signupActivity(activity, userInfo) {
    const {
      participantMale,
      participantMaleProgress,
      participantFemale,
      participantFemaleProgress,
      ended,
    } = this.data;

    if (ended) {
      return;
    }

    let message = null;
    if (participantMale + participantFemale >= activity.maxParticipant) {
      message = '可报名总人数已到上限哦';
    } else if (userInfo.gender == 1 && participantMaleProgress == 100) {
      message = '可报名男生人数已到上限哦';
    } else if (userInfo.gender == 2 && participantFemaleProgress == 100) {
      message = '可报名女生人数已到上限哦';
    }

    if (message) {
      wx.showToast({
        icon: 'none',
        title: message,
      });

      return;
    }

    if (!userInfo.phoneNumber) {
      router.navigateToAuth(router.AUTH_ORIGIN_ACTIVITY_DETAIL);
      return;
    }

    activityRepo.signupActivity(activity._id, userInfo).then(data => {
      this.fetchActivity(activity._id);

      if (activity.qrcode) {
        this.setData({
          showQrcode: true
        });
      }

      wx.showToast({
        title: '报名成功',
      });
      wx.hideLoading();
    });
  },

  quitActivity(activity, userInfo) {
    const { isOrganizer } = this.data;
    if (isOrganizer) {
      wx.showToast({
        icon: 'none',
        title: '主持人不允许跳车哦！',
      });
      return;
    }

    wx.showLoading();
    activityRepo.quitActivity(activity._id).then(res => {
      this.fetchActivity(activity._id);

      wx.showToast({
        icon: 'none',
        title: '取消报名成功，请退出相应活动微信群。',
      });
    }).catch(err => {
      wx.showToast({
        icon: 'none',
        title: '取消报名失败' + err,
      });
      wx.hideLoading();
    });
  },

  editActivity(activity) {
    router.navigateToEditActivity(activity._id);
  },

  onSignupActivity(e) {
    const {
      activity,
      joined,
      isOrganizer,
      userInfo,
    } = this.data;

    if (!userInfo) {
      userRepo.fetchUserInfoOrSignup().then(newUserInfo => {
        this.signupActivity(activity, newUserInfo);
      }).catch(err => {
        wx.showToast({
          icon: 'none',
          title: '暂不支持匿名参加活动',
        });
      })
    } else {
      if (isOrganizer) {
        this.editActivity(activity);
      } else if (joined) {
        this.quitActivity(activity, userInfo);
      } else {
        this.signupActivity(activity, userInfo);
      }
    }
  },

  onClickLike(e) {
    const {
      liked,
      activity
    } = this.data;
    if (liked) {
      userRepo.unlikeActivity(activity._id).then(res => {
        this.setData({
          liked: false
        })
      })
    } else {
      userRepo.likeActivity(activity._id).then(res => {
        wx.showToast({
          icon: 'none',
          title: '收藏成功',
        });

        this.setData({
          liked: true
        })
      })
    }
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
    const { activity } = this.data;
    
    // Just refresh activity when re-visit this page
    if (activity) {
      this.fetchActivity(activity._id);
    }
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