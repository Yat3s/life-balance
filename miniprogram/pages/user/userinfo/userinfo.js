const userRepo = require('../../../repository/userRepo');

const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    photos: [],
  },

  onBirthdayPicked(e) {
    const birthday = e.detail.value;
    this.setData({
      birthday
    });
  },

  onHometownPicked(e) {
    const hometown = e.detail.value;
    hometown.splice(0, 1);
    this.setData({
      hometown: hometown.join("")
    });
  },

  onUserInfoSubmit(e) {
    const {
      height,
      school,
      desc,
      occupation,
      contact
    } = e.detail.value;
    const {
      birthday,
      hometown,
      photos,
      company
    } = this.data;

    const userInfo = {};

    if (contact) {
      userInfo.contact = contact;
    } else if (company) {
      wx.showToast({
        icon: 'none',
        title: 'You must set contact',
      })

      return;
    }

    if (height) {
      userInfo.height = height;
    }

    if (school) {
      userInfo.school = school;
    }

    if (birthday) {
      userInfo.birthday = birthday;
    }

    if (hometown) {
      userInfo.hometown = hometown;
    }

    if (desc) {
      userInfo.desc = desc;
    }

    if (occupation) {
      userInfo.occupation = occupation;
    }

    if (photos) {
      userInfo.photos = photos;
    }

    wx.showLoading();
    userRepo.updateUserInfo(app.globalData.userInfo._id, userInfo).then(res => {
      wx.hideLoading();
      wx.navigateBack({
        delta: 1,
      })
    });
  },

  uploadFile(tempFile) {
    console.log(tempFile);

    return new Promise((resolve, reject) => {
      userRepo.uploadFiles(tempFile.tempFilePaths, 'userphotos').then(urls => {
        resolve({
          urls
        })
      })
    })
  },

  onUploadSuccess(e) {
    let {
      photos
    } = this.data;
    photos.push(...e.detail.urls);
    this.setData({
      photos
    });
  },

  onPhotoDelete(e) {
    const { photos } = this.data;
    photos.splice(e.detail.index, 1);
    this.setData({
      photos
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    userRepo.fetchUserInfoOrSignup().then(userInfo => {
      const files = [];
      if (userInfo.photos) {
        for (const photo of userInfo.photos) {
          files.push({
            url: photo
          })
        }
      }

      console.log(userInfo.photos);

      this.setData({
        company: userInfo.company,
        birthday: userInfo.birthday,
        height: userInfo.height,
        hometown: userInfo.hometown,
        school: userInfo.school,
        desc: userInfo.desc,
        occupation: userInfo.occupation,
        contact: userInfo.contact,
        files,
        photos: userInfo.photos || []
      })
    });

    this.setData({
      uploadFile: this.uploadFile.bind(this)
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