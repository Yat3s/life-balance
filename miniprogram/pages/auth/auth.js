import {
  fetchUserInfoOrSignup,
  fetchCompanies,
  updateUserInfo,
  createEnterpriseAuth,
} from "../../repository/userRepo";
const app = getApp();

Page({
  data: {
    step: 0,
    toolbarHeight: app.globalData.toolbarHeight,
    statusBarHeight: app.globalData.statusBarHeight,
  },

  onCopy(e) {
    const content = e.currentTarget.dataset.content;
    wx.setClipboardData({
      data: content,
    });

    wx.showToast({
      icon: "none",
      title: "Copied to clipboard",
    });
  },

  onBackStep() {
    const { step } = this.data;
    this.setData({
      step: step - 1,
    });
  },

  onCompanySelected(e) {
    const { userInfo, companies } = this.data;
    const selectedCompanyId = e.currentTarget.dataset.companyId;
    const selectDataCompanyId = companies.filter(
      (company) => company.id === selectedCompanyId
    )[0]._id;
    this.setData({
      step: 2,
    });

    const verifyInfo = `${userInfo._openid}@${selectedCompanyId}`;
    const verifyLink = `https://teams.microsoft.com/l/chat/0/0?users=zhiye@microsoft.com&message=${verifyInfo}`;

    this.setData({
      selectDataCompanyId,
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
          icon: "error",
          title: "授权失败" + err,
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
  onSubmit() {
    const { userInfo, selectDataCompanyId } = this.data;

    const enterpriseAuthInfo = {
      userId: userInfo._id,
      company: selectDataCompanyId,
    };

    createEnterpriseAuth(enterpriseAuthInfo)
      .then((res) => {
        if (res.success) {
          app.globalData.pendingMessage =
            "Submit success, please waiting for approval!";
          wx.navigateBack({
            delta: 1,
          });
        } else {
          console.error(res.error);
          wx.showToast({
            icon: "none",
            title: "Submit failed, " + res.message + "!",
          });
        }
      })
      .catch((err) => {
        console.error(err);
        wx.showToast({
          icon: "none",
          title: "Submit failed!",
        });
      });
  },

  onLoad(options) {
    const origin = options.origin;
    this.setData({
      origin,
    });
  },

  onShareAppMessage() {},

  onShareTimeline() {},
});
