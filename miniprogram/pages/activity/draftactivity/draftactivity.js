// miniprogram/pages/activity/draftactivity/draftactivity.js
const activityRepo = require("../../../repository/activityRepo");
const userRepo = require("../../../repository/userRepo");
const pref = require("../../../common/preference");
const {
  subscribeActivityNotification,
} = require("../../../repository/notificationHelper");

const app = getApp();
const MAX_TAG_LENGTH = 12;
const MAX_TAGS_SIZE = 4;
const MAX_TITLE_LENGTH = 30;
const MAX_PARTICIPANT = 100;

Page({
  /**
   * 页面的初始数据
   */
  data: {
    toolbarHeight: app.globalData.toolbarHeight,
    statusBarHeight: app.globalData.statusBarHeight,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const type = options.type;
    this.setData({
      type,
    });

    activityRepo.fetchAllActivityCategories().then((categories) => {
      this.setData({
        categories,
      });
    });

    userRepo.fetchUserInfo().then((userInfo) => {
      this.setData({
        userInfo,
      });
    });

    if (type === "edit" || type === "repost") {
      const id = options.id;
      wx.showLoading();
      activityRepo.fetchActivityItem(id).then((activity) => {
        let startDate = new Date(activity.startDate);
        let startDateStr = startDate.yyyymmdd();
        let startTimeStr = startDate.hhmm();

        let endDate = new Date(activity.endDate);
        let endDateStr = endDate.yyyymmdd();
        let endTimeStr = endDate.hhmm();
        const genderRequired =
          activity.maxParticipantFemale &&
          activity.maxParticipantMale &&
          activity.maxParticipantFemale + activity.maxParticipantMale > 0;

        if (type === "repost") {
          // Initial date picker
          const now = new Date();
          startDateStr = now.yyyymmdd();
          startTimeStr = `${now.getHours()}:00`;
          endDateStr = now.yyyymmdd();
          endTimeStr = `${now.getHours()}:30`;
        }

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

        activityRepo.fetchCategory(activity.category).then((category) => {
          this.setData({
            category,
          });
        });
      });
    } else if (type === "new") {
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
        detail: "[Note]",
      });
    }
  },

  back() {
    wx.navigateBack({
      delta: 1,
    });
  },

  chooseLocation() {
    wx.chooseLocation().then((res) => {
      this.setData({
        location: res,
      });
    });
  },

  onGenderSwitch(e) {
    const genderRequired = e.detail.value;
    this.setData({
      genderRequired,
    });
  },

  onClickDeleteActivity() {
    const { activityId } = this.data;

    if (!activityId) {
      wx.showToast({
        icon: "error",
        title: "Failed to delete",
      });

      return;
    }

    wx.showModal({
      title: "Delete activity",
      content: "It can't be restored if deleted",
      success(res) {
        if (res.confirm) {
          activityRepo.deleteActivity(activityId).then((res) => {
            wx.showToast({
              icon: "success",
              title: "Success",
            });

            wx.navigateBack({
              delta: 2,
            });
          });
        } else if (res.cancel) {
          console.log("用户点击取消");
        }
      },
    });
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
      qrcodeFileId,
      genderRequired,
      type,
    } = this.data;

    let { location } = this.data;

    const { title, detail, fee, locationName } = value;

    // Location
    if (!location) {
      location = {};
    }
    location.name = locationName;

    // Tags
    let tags = [];
    if (!value.tags && category) {
      tags.push(category.name);
    } else {
      tags = value.tags.split(" ");
    }

    // Participants
    const maxParticipantMale = parseInt(
      genderRequired ? value.maxParticipantMale || 50 : 0
    );
    const maxParticipantFemale = parseInt(
      genderRequired ? value.maxParticipantFemale || 50 : 0
    );
    const maxParticipant = parseInt(
      genderRequired
        ? maxParticipantMale + maxParticipantFemale
        : value.maxParticipant || 100
    );

    // Date
    const startDate = Date.parse(
      (startDateStr + " " + startTimeStr).replace(/-/g, "/")
    );
    const endDate = Date.parse(
      (endDateStr + " " + endTimeStr).replace(/-/g, "/")
    );

    // Input check
    let sanityMessage = null;
    if (!title || !category || !locationName || !coverFileId) {
      sanityMessage = "Please complete the form information";
    }

    if (tags.length > MAX_TAGS_SIZE) {
      sanityMessage = `The tag size should be less than ${MAX_TAGS_SIZE}`;
    }

    if (maxParticipant > MAX_PARTICIPANT) {
      sanityMessage = `The participants should be less than ${MAX_PARTICIPANT}`;
    }

    if (maxParticipant <= 1) {
      sanityMessage = `The participants should be more than 2`;
    }

    let tagLengthInvalid = false;
    for (const tag of tags) {
      if (tag.length > MAX_TAG_LENGTH) {
        tagLengthInvalid = true;
      }
    }

    if (tagLengthInvalid) {
      sanityMessage = `The tag length should be shorter than ${MAX_TAG_LENGTH}`;
    }

    if (startDate > endDate) {
      sanityMessage = "The start date should early than end date";
    }

    if (title.length > MAX_TITLE_LENGTH) {
      sanityMessage = `The title length should less than ${MAX_TITLE_LENGTH}`;
    }

    if (sanityMessage) {
      wx.showToast({
        icon: "none",
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
      qrcode: qrcodeFileId,

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

      published: true,
    };

    console.log("ActivityBody: ", activityBody);
    if (type === "new" || type === "repost") {
      const participants = [];
      participants.push(userInfo);
      activityBody.organizer = userInfo;
      activityBody.participants = participants;
      activityBody._createTime = Date.now();

      const organizerLocation = {
        city: pref.getCity(),
        latitude: pref.getLatitude(),
        longitude: pref.getLongitude(),
      };
      activityBody.organizerLocation = organizerLocation;

      wx.showLoading();
      activityRepo.draftActivity(activityBody).then((res) => {
        wx.hideLoading();
        app.globalData.pendingMessage = "Created success!";
        subscribeActivityNotification();
      });
    } else if (type === "edit") {
      const { activityId } = this.data;
      wx.showModal({
        title: "Update Activity",
        content: "You are updating the activity",
        success(res) {
          if (res.confirm) {
            activityBody._updateTime = Date.now();
            wx.showLoading();
            activityRepo
              .updateActivity(activityId, activityBody)
              .then((res) => {
                wx.hideLoading();
                app.globalData.pendingMessage = "Update success!";
                subscribeActivityNotification();
              });
          } else if (res.cancel) {
          }
        },
      });
    }
  },

  uploadCover() {
    wx.chooseImage({
      count: 1,
    }).then((res) => {
      wx.showLoading();
      wx.cloud
        .uploadFile({
          cloudPath: `cover-${new Date().getTime()}.png`,
          filePath: res.tempFilePaths[0],
        })
        .then((file) => {
          wx.hideLoading();
          this.setData({
            coverFileId: file.fileID,
          });
        })
        .catch((err) => {
          wx.hideLoading();
        });
    });
  },

  uploadQrcode() {
    wx.chooseImage({
      count: 1,
    }).then((res) => {
      wx.showLoading();
      wx.cloud
        .uploadFile({
          cloudPath: `qrcode-${new Date().getTime()}.png`,
          filePath: res.tempFilePaths[0],
        })
        .then((file) => {
          wx.hideLoading();
          this.setData({
            qrcodeFileId: file.fileID,
          });
        })
        .catch((err) => {
          wx.hideLoading();
        });
    });
  },

  onCategoryPicked(e) {
    const { categories } = this.data;
    const category = categories[e.detail.value];
    this.setData({
      category,
    });
  },

  onStartDatePicked(e) {
    const startDateStr = e.detail.value;
    this.setData({
      startDateStr,
    });
  },

  onStartTimePicked(e) {
    const startTimeStr = e.detail.value;
    this.setData({
      startTimeStr,
    });
  },

  onEndDatePicked(e) {
    const endDateStr = e.detail.value;
    this.setData({
      endDateStr,
    });
  },

  onEndTimePicked(e) {
    const endTimeStr = e.detail.value;
    this.setData({
      endTimeStr,
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {},

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {},

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {},

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {},

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {},

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {},

  onShareTimeline() {},
});
