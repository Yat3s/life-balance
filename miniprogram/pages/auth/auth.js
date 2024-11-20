import {
  fetchUserInfoOrSignup,
  fetchCompanies,
  updateUserInfo,
} from '../../repository/userRepo';
const app = getApp();

Page({
  data: {
    step: 0,
  },

  onCopy(e) {
    const content = e.currentTarget.dataset.content;
    wx.setClipboardData({
      data: content,
    });

    wx.showToast({
      icon: 'none',
      title: 'Copied to clipboard',
    });
  },

  onCompanySelected(e) {
    const { userInfo } = this.data;
    const selectedCompanyId = e.detail.value;
    this.setData({
      step: 2,
    });

    const verifyInfo = `${userInfo._openid}@${selectedCompanyId}`;
    const verifyLink = `https://teams.microsoft.com/l/chat/0/0?users=zhiye@microsoft.com&message=${verifyInfo}`;

    this.setData({
      verifyInfo,
      verifyLink,
    });
  },

  onCompanyAuth(e) {
    wx.showLoading();
    fetchUserInfoOrSignup()
      .then((userInfo) => {
        wx.hideLoading();
        this.setData({
          step: 1,
          userInfo,
        });
        this.fetchCompanyList();

        setTimeout(() => {
          this.setData({
            showChooseCompany: true,
          });
        }, 800);
      })
      .catch((err) => {
        wx.hideLoading();

        wx.showToast({
          duration: 1000,
          icon: 'error',
          title: '授权失败' + err,
        });
      });
  },

  fetchCompanyList() {
    fetchCompanies().then((companies) => {
      this.setData({
        companies,
      });
    });
  },

  onContactInput(e) {
    const contact = e.detail.value;
    this.setData({
      contact,
    });
  },

  onSubmit() {
    const { contact, userInfo } = this.data;
    if (!contact || contact.length == 0) {
      wx.showToast({
        icon: 'none',
        title: 'Please setting contact information',
      });

      return;
    }

    const updateData = {
      contact,
    };
    updateUserInfo(userInfo._id, updateData).then((res) => {
      app.globalData.pendingMessage =
        'Submit success, please waiting for approval!';
      wx.navigateBack({
        delta: 1,
      });
    });
  },

  onLoad(options) {
    const origin = options.origin;
    this.setData({
      origin,
    });
  },
});
