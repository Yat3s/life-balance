import {
  updateUserInfo,
  uploadFiles,
  fetchUserInfoOrSignup,
} from '../../../repository/userRepo';
const app = getApp();

Page({
  data: {
    photos: [],
    isNewAvatar: false,
  },

  onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    console.log('Avatar URL: ', avatarUrl);
    this.setData({
      avatarTmpUrl: avatarUrl,
      isNewAvatar: true,
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
      hometown: hometown.join(''),
    });
  },

  onPhoneNumberInput(e) {
    const phonedNumber = e.detail.value.replace(/\D/g, '');
    this.setData({
      phoneNumber: phonedNumber,
    });
  },

  onUserInfoSubmit(e) {
    const { height, school, desc, occupation, contact, address, nickName } =
      e.detail.value;
    const {
      birthday,
      hometown,
      photos,
      company,
      phoneNumber,
      avatarTmpUrl,
      isNewAvatar,
    } = this.data;

    const userInfo = {};

    if (contact) {
      userInfo.contact = contact;
    } else if (company) {
      wx.showToast({
        icon: 'none',
        title: 'You must set contact',
      });

      return;
    }

    if (nickName) {
      userInfo.nickName = nickName;
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

    if (phoneNumber) {
      userInfo.phoneNumber = phoneNumber;
    }

    if (address) {
      userInfo.address = address;
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

    if (isNewAvatar && avatarTmpUrl) {
      wx.cloud
        .uploadFile({
          cloudPath: `avatars/${Date.now()}-${Math.floor(
            Math.random() * 1000
          )}.png`,
          filePath: avatarTmpUrl,
        })
        .then((res) => {
          userInfo.avatarUrl = res.fileID;
          updateProfile();
        })
        .catch((error) => {
          wx.hideLoading();
          wx.showToast({
            icon: 'none',
            title: 'Avatar upload failed',
          });
        });
    } else if (avatarTmpUrl) {
      userInfo.avatarUrl = avatarTmpUrl;
      updateProfile();
    } else {
      updateProfile();
    }
  },

  uploadFile(tempFile) {
    console.log(tempFile);

    return new Promise((resolve, reject) => {
      uploadFiles(tempFile.tempFilePaths, 'userphotos').then((urls) => {
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

      console.log(userInfo.photos);

      this.setData({
        nickName: userInfo.nickName,
        avatarTmpUrl: userInfo.avatarUrl,
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
});
