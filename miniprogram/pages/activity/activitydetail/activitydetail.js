// miniprogram/pages/activity/activitydetail/activitydetail.js
const activityRepo = require('../../../repository/activityRepo');
const userRepo = require('../../../repository/userRepo');
const pref = require('../../../common/preference');
const util = require('../../../common/util');
const router = require('../../router');
const { notifyActivityHost } = require('../../../repository/notificationHelper');

const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    toolbarHeight: app.globalData.toolbarHeight,
    statusBarHeight: app.globalData.statusBarHeight,
    isOrganizer: false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.fetchActivity(options.id).then(activity => {
      this.fetchUserInfo();
    });
  },

  calcDistance(latitude, longitude) {
    const {
      activity,
    } = this.data;

    if (!activity || !latitude) {
      return;
    }

    if (activity.location && activity.location.latitude) {
      const distance = util.calcDistance(activity.location.latitude, activity.location.longitude, latitude, longitude);
      activity.distance = distance;
      activity.distanceStr = `(${distance}km)`;
    }

    this.setData({
      activity
    });
  },

  fetchUserInfo() {
    userRepo.fetchUserInfo().then(userInfo => {
      this.handleUserState(userInfo);

      this.setData({
        showingModal: userInfo.gender === 0 ? 'gender' : ''
      })
    })
  },

  handleUserState(userInfo) {
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
    const isOrganizer = userInfo._openid == activity.organizer._openid;

    this.setData({
      userInfo,
      joined,
      liked,
      isOrganizer,
      ended,
    });
  },

  fetchActivity(id) {
    wx.showLoading();

    return new Promise((resolve, reject) => {
      activityRepo.fetchActivityItem(id).then(activity => {
        console.log(activity);
        wx.hideLoading();
        let participantMale = 0;
        let participantFemale = 0;
        let participantNonBinary = 0;
        let participantGenderUnknown = 0;

        for (const participant of activity.participants) {
          if (participant.gender === 0) {
            participantGenderUnknown++;
          }
          if (participant.gender === 1) {
            participantMale++;
          }

          if (participant.gender === 2) {
            participantFemale++;
          }

          if (participant.gender === 3) {
            participantNonBinary++;
          }

          const joinedAtDate = new Date(participant.joinedAt);
          participant.joinedAtStr = joinedAtDate.dateStr() + " " + joinedAtDate.hhmm();
        }

        const participantMaleProgress = participantMale == 0 ? 0 : Math.max(20, parseInt(participantMale / activity.maxParticipantMale * 100));
        const participantFemaleProgress = participantFemale == 0 ? 0 : Math.max(20, parseInt(participantFemale / activity.maxParticipantFemale * 100));
        const maxParticipantMalePercent = parseInt(activity.maxParticipantMale / activity.maxParticipant * 100);
        const maxParticipantFemalePercent = parseInt(activity.maxParticipantFemale / activity.maxParticipant * 100);

        const createDate = new Date(activity._createTime);
        activity.createAtStr = createDate.dateStr() + " " + createDate.hhmm();
        this.setData({
          activity,
          participantMale,
          participantMaleProgress,
          participantFemale,
          participantFemaleProgress,
          maxParticipantMalePercent,
          maxParticipantFemalePercent,

          participantNonBinary,
          participantGenderUnknown
        });

        this.handleUserState(this.data.userInfo);

        resolve(activity);
      }).catch(err => {

        reject(err);
        wx.hideLoading();
      });
    })

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
    const {
      activity
    } = this.data;

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

  onClickViewParticipantDetail() {
    this.setData({
      showingModal: 'participant'
    });
  },

  showQrcodeModal() {
    const {
      joined,
      activity
    } = this.data;

    if (!joined) {
      wx.showToast({
        icon: 'none',
        title: 'Please join first',
      });

      return;
    }

    if (!activity.qrcode) {
      wx.showToast({
        icon: 'none',
        title: 'Oops, have not QR code yet',
      });

      return;
    }


    this.setData({
      showingModal: 'qrcode'
    });
  },

  onAvatarClick(e) {
    const userId = e.currentTarget.dataset.id;
    router.navigateToProfile(userId);
  },

  onDismissModal() {
    this.setData({
      showingModal: ''
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
          title: 'Save success',
        })
      })
    })
  },

  signupActivity(activitySnapshot, userInfo) {

    const { isSignup } = this.data;

    if (isSignup) {
      return;
    }

    this.setData({ isSignup : true });

    // Fetch the latest activity
    this.fetchActivity(activitySnapshot._id).then(activity => {
      const {
        participantMale,
        participantMaleProgress,
        participantFemale,
        participantFemaleProgress,
        ended,
      } = this.data;

      if (ended) {
        this.setData({ isSignup : false});
        return;
      }

      if (!userInfo.company) {
        router.navigateToAuth(router.AUTH_ORIGIN_ACTIVITY_DETAIL);
        this.setData({ isSignup : false});
        return;
      }

      let message = null;
      if (activity.participants.length >= activity.maxParticipant) {
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

        this.setData({ isSignup : false});
        return;
      }

      userInfo.joinedAt = Date.now();

      activityRepo.signupActivity(activity._id, userInfo).then(data => {
        this.fetchActivity(activity._id);

        notifyActivityHost(activity);

        if (activity.qrcode) {
          this.setData({
            showingModal: 'qrcode'
          });
        }

        wx.showToast({
          title: 'Join success!',
        });
        wx.hideLoading();
        this.setData({ isSignup : false});
      }).catch(err => {
        this.setData({ isSignup : false});
      });
    }).catch(err => {
      this.setData({ isSignup : false});
    })
  },

  quitActivity(activity, userInfo) {
    wx.showLoading();
    activityRepo.quitActivity(activity._id).then(res => {
      this.fetchActivity(activity._id);

      wx.showToast({
        icon: 'none',
        duration: 2000,
        title: 'Cancel the registration successfully!',
      });
    }).catch(err => {
      wx.showToast({
        icon: 'none',
        title: 'Failed to cancel' + err,
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
      ended
    } = this.data;

    if (ended) {
      return;
    }

    if (!userInfo) {
      userRepo.fetchUserInfoOrSignup().then(newUserInfo => {
        this.signupActivity(activity, newUserInfo);
      }).catch(err => {
        wx.showToast({
          icon: 'none',
          title: "Do not allow anonymous operation",
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

  onRepostClick() {
    const {
      activity,
    } = this.data;
    router.navigateToRepostActivity(activity._id)
  },

  onEditClick() {
    const {
      activity,
    } = this.data;

    this.editActivity(activity);
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
          title: 'Success!',
        });

        this.setData({
          liked: true
        })
      })
    }
  },

  onSelectedGender(e) {
    const selectedGenderIndex = e.currentTarget.dataset.index;
    this.setData({
      selectedGenderIndex
    })
  },

  onSubmitGender() {
    const { selectedGenderIndex, userInfo } = this.data;
    if (selectedGenderIndex <= 0) {
      wx.showToast({
        icon: 'none',
        title: 'You must set gender.',
      });

      return;
    }

    userRepo.updateUserInfo(userInfo._id, {
      gender: selectedGenderIndex
    });
    userInfo.gender = selectedGenderIndex;

    this.setData({
      showingModal: '',
      userInfo
    })
  },

  onClickContact(e) {
    const { isOrganizer, activity } = this.data;
    const index = e.currentTarget.dataset.index;

    if (!isOrganizer && index != 0) {
      wx.showToast({
        icon: 'none',
        title: "Only organizer can view members' contact",
      });

      return;
    }
    wx.setClipboardData({
      data: activity.participants[index].contact,
    })

    wx.showToast({
      icon: 'none',
      title: 'Copied to clipboard',
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
    const {
      activity
    } = this.data;

    // Just refresh activity when re-visit this page
    if (activity) {
      this.fetchActivity(activity._id);
    }

    if (app.globalData.pendingMessage) {
      wx.showToast({
        icon: 'none',
        duration: 2000,
        title: app.globalData.pendingMessage,
      })
      app.globalData.pendingMessage = null;
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
    const { activity } = this.data;
    return {
      title: activity.startDateStr + " " + activity.title
    }
  }
})