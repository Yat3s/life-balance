import {
  updateUserInfo,
  uploadFiles,
  fetchUserInfoOrSignup,
} from "../../../repository/userRepo";
const app = getApp();

Page({
  data: {
    photos: [],
  },

  handleAvatarChosen() {
    const that = this;
    wx.chooseMedia({
      count: 1,
      mediaType: ["image"],
      sizeType: ["original"],
      sourceType: ["album", "camera"],
      maxDuration: 30,
      camera: "back",
      success(res) {
        console.log("Success", res);
        that.upLoadImg(res.tempFiles[0].tempFilePath);
      },
    });
  },

  upLoadImg(fileUrl) {
    const that = this;
    wx.cloud.uploadFile({
      cloudPath: `avatars/${Date.now()}-${Math.floor(
        Math.random() * 1000
      )}.png`,
      filePath: fileUrl,
      success: (res) => {
        that.setData({
          avatarUrl: res.fileID,
        });
      },
      fail: console.error,
    });
  },

  onBirthdayPicked(e) {
    const birthday = e.detail.value;
    this.setData({
      birthday,
    });
  },

  onHometownPicked(e) {
    const hometown = e.detail.value;
    hometown.splice(0, 1);
    this.setData({
      hometown: hometown.join(""),
    });
  },

  onPhoneNumberInput(e) {
    const phonedNumber = e.detail.value.replace(/\D/g, "");
    this.setData({
      phoneNumber: phonedNumber,
    });
  },

  onUserInfoSubmit(e) {
    const { height, school, desc, occupation, contact, address, nickName } =
      e.detail.value;
    const { birthday, hometown, photos, company, phoneNumber, avatarUrl } =
      this.data;

    if (!nickName || nickName.trim() === "") {
      wx.showToast({
        icon: "none",
        title: "You must set nickname",
      });
      return;
    }

    const userInfo = {
      nickName: nickName,
      height: height || "",
      school: school || "",
      desc: desc || "",
      occupation: occupation || "",
      contact: contact || "",
      address: address || "",
      birthday: birthday || "",
      hometown: hometown || "",
      phoneNumber: phoneNumber || "",
      avatarUrl: avatarUrl || "",
    };

    if (!userInfo.contact && company) {
      wx.showToast({
        icon: "none",
        title: "You must set contact",
      });
      return;
    }

    if (photos) {
      userInfo.photos = photos;
    }

    wx.showLoading();

    const updateProfile = () => {
      updateUserInfo(app.globalData.userInfo._id, userInfo).then(() => {
        wx.hideLoading();
        wx.navigateBack({
          delta: 1,
        });
      });
    };

    updateProfile();
  },

  uploadFile(tempFile) {
    console.log(tempFile);

    return new Promise((resolve, reject) => {
      uploadFiles(tempFile.tempFilePaths, "userphotos").then((urls) => {
        resolve({
          urls,
        });
      });
    });
  },

  onUploadSuccess(e) {
    let { photos } = this.data;
    photos.push(...e.detail.urls);
    this.setData({
      photos,
    });
  },

  onPhotoDelete(e) {
    const { photos } = this.data;
    photos.splice(e.detail.index, 1);
    this.setData({
      photos,
    });
  },

  onLoad(options) {
    fetchUserInfoOrSignup().then((userInfo) => {
      const files = [];
      if (userInfo.photos) {
        for (const photo of userInfo.photos) {
          files.push({
            url: photo,
          });
        }
      }

      this.setData({
        nickName: userInfo.nickName,
        avatarUrl: userInfo.avatarUrl,
        company: userInfo.company,
        birthday: userInfo.birthday,
        height: userInfo.height,
        hometown: userInfo.hometown,
        school: userInfo.school,
        desc: userInfo.desc,
        occupation: userInfo.occupation,
        contact: userInfo.contact,
        files,
        photos: userInfo.photos || [],
        phoneNumber: userInfo.phoneNumber,
        address: userInfo.address,
      });
    });

    this.setData({
      uploadFile: this.uploadFile.bind(this),
    });
  },

  onShareAppMessage() {},

  onShareTimeline() {},
});
