// miniprogram/pages/activity/draftactivity/draftactivity.js
const activityRepo = require('../../../repository/activityRepo');
const userRepo = require('../../../repository/userRepo');

const app = getApp();
const TMP_ID_EVENT_CREATED = '9UbBuyHoTS8vX0UaIGqf2rAwcQS3kM1giOV9EPJp1O8'
const MAX_TAG_LENGTH = 8;
const MAX_TAGS_SIZE = 4;
const MAX_TITLE_LENGTH = 30;
const MAX_PARTICIPANT = 100;

Date.prototype.yyyymmdd = function () {
  var mm = this.getMonth() + 1; // getMonth() is zero-based
  var dd = this.getDate();

  return [this.getFullYear(),
    (mm > 9 ? '' : '0') + mm,
    (dd > 9 ? '' : '0') + dd
  ].join('-');
};

Date.prototype.hhmm = function () {
  var hh = this.getHours();
  var mm = this.getMinutes();

  return [
    (hh > 9 ? '' : '0') + hh,
    (mm > 9 ? '' : '0') + mm
  ].join(':');
};

Page({

  /**
   * 页面的初始数据
   */
  data: {
    toolbarHeight: app.globalData.toolbarHeight,
    statusBarHeight: app.globalData.statusBarHeight
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const type = options.type;
    this.setData({
      type
    })

    activityRepo.fetchAllActivityCategories().then(categories => {
      this.setData({
        categories
      });
    });

    userRepo.fetchUserInfo().then(userInfo => {
      this.setData({
        userInfo
      })
    });

    if (type == 'edit') {
      const id = options.id;
      wx.showLoading();
      activityRepo.fetchActivityItem(id).then(activity => {
        const startDate = new Date(activity.startDate);
        const startDateStr = startDate.yyyymmdd();
        const startTimeStr = startDate.hhmm();

        const endDate = new Date(activity.endDate);
        const endDateStr = endDate.yyyymmdd();
        const endTimeStr = endDate.hhmm();
        const genderRequired = activity.maxParticipantFemale &&
          activity.maxParticipantMale &&
          (activity.maxParticipantFemale + activity.maxParticipantMale > 0)

        this.setData({
          activityId: activity._id,
          startDateStr,
          startTimeStr,
          endDateStr,
          endTimeStr,
          title: activity.title,
          location: activity.location,
          fee: activity.fee,
          maxParticipant: activity.maxParticipant,
          detail: activity.detail,
          tags: activity.tags.join(" "),
          coverFileId: activity.picture,
          maxParticipantFemale: activity.maxParticipantFemale,
          maxParticipantMale: activity.maxParticipantMale,
          genderRequired,
        });

        wx.hideLoading();

        activityRepo.fetchCategory(activity.category).then(category => {
          this.setData({
            category
          })
        })
      })

    } else if (type == 'new') {
      // Initial date picker
      const now = new Date();
      const startDateStr = now.yyyymmdd();
      const startTimeStr = `${now.getHours()}:00`;
      const endDateStr = now.yyyymmdd();
      const endTimeStr = `${now.getHours()}:30`;

      this.setData({
        startDateStr,
        startTimeStr,
        endDateStr,
        endTimeStr,
        detail: "【活动介绍】\n【活动要求】\n【注意事项】\n"
      });
    }
  },

  back() {
    wx.navigateBack({
      delta: 1,
    })
  },

  chooseLocation() {
    wx.chooseLocation().then(res => {
      this.setData({
        location: res
      });
    })
  },

  onGenderSwitch(e) {
    const genderRequired = e.detail.value;
    this.setData({
      genderRequired
    })
  },

  // onButtonSumit() {
  //   // Workaround to subscribe notification
  //   wx.getSetting({
  //     withSubscriptions: true,
  //   }).then(res => {
  //     console.log(res);
  //     const subscriptions = res.subscriptionsSetting.itemSettings;
  //     if (!subscriptions || subscriptions[TMP_ID_EVENT_CREATED] != 'accept') {
  //       wx.requestSubscribeMessage({
  //         tmplIds: ['9UbBuyHoTS8vX0UaIGqf2rAwcQS3kM1giOV9EPJp1O8'],
  //         success(res) {
  //           console.log(res);
  //         },
  //         fail(err) {
  //           console.log(err);
  //         }
  //       })
  //     }
  //   })
  // },

  onClickDeleteActivity() {
    const {
      activityId
    } = this.data;

    if (!activityId) {
      wx.showToast({
        icon: 'error',
        title: '删除失败',
      })

      return;
    }

    wx.showModal({
      title: '删除活动',
      content: '活动删除后将无法还原',
      success (res) {
        if (res.confirm) {
          activityRepo.deleteActivity(activityId).then(res => {
            wx.showToast({
              icon: 'success',
              title: '删除成功',
            });

            wx.navigateBack({
              delta: 2,
            })
          })
        } else if (res.cancel) {
          console.log('用户点击取消')
        }
      }
    })
  },

  onSubmit(e) {
    const value = e.detail.value;
    const {
      category,
      startDateStr,
      startTimeStr,
      endDateStr,
      endTimeStr,
      userInfo,
      coverFileId,
      genderRequired,
      type,
    } = this.data;

    let {
      location
    } = this.data;

    const {
      title,
      detail,
      fee,
      locationName
    } = value;

    // Location
    if (!location) {
      location = {}
    }
    location.name = locationName

    // Tagss
    let tags = [];
    if (!value.tags) {
      tags.push(category.name);
    } else {
      tags = value.tags.split(" ");
    }

    // Participants
    const maxParticipantMale = parseInt(genderRequired ? (value.maxParticipantMale || 50) : 0);
    const maxParticipantFemale = parseInt(genderRequired ? (value.maxParticipantFemale || 50) : 0);
    const maxParticipant = parseInt(genderRequired ? maxParticipantMale + maxParticipantFemale : value.maxParticipant || 100);

    // Date
    const startDate = Date.parse((startDateStr + " " + startTimeStr).replace(/-/g, "/"));
    const endDate = Date.parse((endDateStr + " " + endTimeStr).replace(/-/g, "/"));

    // Input check
    let sanityMessage = null;
    if (!title || !category || !locationName || !coverFileId) {
      sanityMessage = '请完整填写活动信息';
    }

    if (tags.length > MAX_TAGS_SIZE) {
      sanityMessage = `标签的数量不能多于${MAX_TAGS_SIZE}个`;
    }

    if (maxParticipant > MAX_PARTICIPANT) {
      sanityMessage = `最大参与人数不能多于${MAX_PARTICIPANT}人`;
    }

    let tagLengthInvalid = false;
    for (const tag of tags) {
      if (tag.length > MAX_TAG_LENGTH) {
        tagLengthInvalid = true;
      }
    }

    if (tagLengthInvalid) {
      sanityMessage = `单个标签的长度不能长于${MAX_TAG_LENGTH}`;
    }

    if (startDate > endDate) {
      sanityMessage = '活动结束时间应晚于开始时间';
    }

    if (title.length > MAX_TITLE_LENGTH) {
      sanityMessage = `活动标题不能长于${MAX_TITLE_LENGTH}`;
    }

    if (sanityMessage) {
      wx.showToast({
        icon: 'none',
        title: sanityMessage,
      });

      return;
    }


    const activityBody = {
      // Basic
      title,
      detail,
      fee: parseInt(fee) || 0,
      picture: coverFileId,

      // Participant
      maxParticipant: maxParticipant || 0,
      maxParticipantMale,
      maxParticipantFemale,

      // Date
      startDate,
      endDate,

      // Category
      category: category._id,

      // Location
      location,

      // Tags
      tags,

      published: false
    }

    console.log("ActivityBody: ", activityBody);
    wx.showLoading();
    if (type == 'new') {
      const participants = [];
      participants.push(userInfo);
      activityBody.organizer = userInfo,
        activityBody.participants = participants,
        activityBody._createTime = Date.now(),

        activityRepo.draftActivity(activityBody).then(res => {
          wx.hideLoading();
          wx.showToast({
            icon: 'none',
            title: '活动已提交审核，请在【我的】-【全部活动/发起的活动】中查看。',
          })

          wx.navigateBack({
            delta: 1,
          })
        });
    } else if (type == 'edit') {
      wx.showModal({
        title: '更新活动',
        content: '修改提交后，活动内容将重新审核',
        success (res) {
          if (res.confirm) {
            const {
              activityId
            } = this.data;
            activityBody._updateTime = Date.now(),
              activityRepo.updateActivity(activityId, activityBody).then(res => {
                wx.hideLoading();
                wx.showToast({
                  icon: 'none',
                  title: '活动已更新并重新提交审核，请在【我的】-【全部活动/发起的活动】中查看。',
                }).then(res => {
                  wx.navigateBack({
                    delta: 1,
                  })
                })
              });
          } else if (res.cancel) {
          }
        }
      })
    }
  },

  uploadCover() {
    wx.chooseImage({
      count: 1,
    }).then(res => {
      wx.showLoading();
      wx.cloud.uploadFile({
        cloudPath: `cover-${new Date().getTime()}.png`,
        filePath: res.tempFilePaths[0]
      }).then(file => {
        wx.hideLoading();
        this.setData({
          coverFileId: file.fileID
        })
      }).catch(err => {
        wx.hideLoading();
      })
    })
  },

  uploadQrcode() {
    wx.chooseImage({
      count: 1,
    }).then(res => {
      wx.showLoading();
      wx.cloud.uploadFile({
        cloudPath: `qrcode-${new Date().getTime()}.png`,
        filePath: res.tempFilePaths[0]
      }).then(file => {
        wx.hideLoading();
        this.setData({
          qrcodeFileId: file.fileID
        })
      }).catch(err => {
        wx.hideLoading();
      })
    })
  },

  onCategoryPicked(e) {
    const {
      categories
    } = this.data;
    const category = categories[e.detail.value];
    this.setData({
      category
    });
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

  onEndDatePicked(e) {
    const endDateStr = e.detail.value;
    this.setData({
      endDateStr
    })
  },

  onEndTimePicked(e) {
    const endTimeStr = e.detail.value;
    this.setData({
      endTimeStr
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