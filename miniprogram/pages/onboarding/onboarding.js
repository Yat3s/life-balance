import { signup } from '../../repository/userRepo';
const app = getApp();

Page({
  data: {
    nickName: null,
    avatarTmpUrl: null,
    isAgreed: false,
  },

  onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    console.log('Avatar URL: ', avatarUrl);
    this.setData({
      avatarTmpUrl: avatarUrl,
    });
  },

  onNickNameChange(e) {
    this.setData({
      nickName: e.detail.value,
    });
  },

  onAgreementChange() {
    this.setData({
      isAgreed: !this.data.isAgreed,
    });
  },

  openPrivacyContract() {
    wx.openPrivacyContract({
      fail: () => {
        wx.showToast({
          title: '遇到错误',
          icon: 'error',
        });
      },
    });
  },

  onFormSubmit(e) {
    const { nickName } = e.detail.value;
    const { avatarTmpUrl, isAgreed } = this.data;

    if (!avatarTmpUrl) {
      wx.showToast({
        icon: 'none',
        title: 'Please set your avatar',
      });
      return;
    }

    if (!nickName) {
      wx.showToast({
        icon: 'none',
        title: 'Please set your nickname',
      });
      return;
    }

    if (!isAgreed) {
      wx.showToast({
        icon: 'none',
        title: 'Please agree to the terms',
      });
      return;
    }

    wx.showLoading({
      title: 'Signing up...',
    });

    wx.cloud
      .uploadFile({
        cloudPath: `avatars/${Date.now()}-${Math.floor(
          Math.random() * 1000
        )}.png`,
        filePath: avatarTmpUrl,
      })
      .then((res) => {
        const avatarUrl = res.fileID;
        console.log('Avatar URL: ', avatarUrl);

        return signup({
          avatarUrl,
          nickName,
        });
      })
      .then((res) => {
        wx.hideLoading();
        console.log(res);
        app.globalData.userInfo = res;
        wx.reLaunch({
          url: `/pages/index/index`,
        });
      })
      .catch((error) => {
        wx.hideLoading();
        wx.showToast({
          title: error.message || '操作失败，请重试',
          icon: 'error',
        });
      });
  },
});
