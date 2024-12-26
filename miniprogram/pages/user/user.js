import { getAppConfig } from "../../repository/baseRepo";
import { fetchAllSponsors as _fetchAllSponsors } from "../../repository/sponsorRepo";
import {
  fetchUserInfo as _fetchUserInfo,
  fetchCompany,
  updateUserInfo,
} from "../../repository/userRepo";
import {
  navigateToAdmin,
  navigateToAuth,
  navigateToCMS,
  navigateToEditUserInfo,
  navigateToPendingAuthListPage,
  navigateToProfile,
  navigateToUserActivity,
  navigateToUserProduct,
  navigationToContribution,
} from "../router";

Component({
  options: {
    addGlobalClass: true,
  },
  properties: {},
  data: {
    github: "https://github.com/Yat3s/life-balance",
    isProcessingPayment: false,
    amounts: [
      { value: 6, label: "❤️ 6 CNY" },
      { value: 16, label: "☕️ 16 CNY" },
      { value: 36, label: "🚗 36 CNY" },
      { value: 66, label: "✈️ 66 CNY" },
      { value: 88, label: "🚀 88 CNY" },
    ],
  },

  methods: {
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
          const updateData = {
            avatarUrl: res.fileID,
          };

          updateUserInfo(that.data.userInfo._id, updateData).then(() => {
            that.setData({
              userInfo: { ...that.data.userInfo, avatarUrl: res.fileID },
            });
          });
        },
        fail: console.error,
      });
    },

    onAdminConsoleClick() {
      navigateToCMS();
    },

    onActivityClick() {
      navigateToUserActivity();
    },

    onProfileClick() {
      navigateToProfile(this.data.userInfo._id);
    },

    onMallClick() {
      navigateToUserProduct();
    },

    onEditUserInfoClick() {
      navigateToEditUserInfo();
    },

    onContributionClick() {
      wx.reportEvent("contributiontap", {});
      navigationToContribution();
    },

    onStarClick() {
      wx.reportEvent("githubtap", {});
      this.setData(
        {
          showingModal: "github",
        },
        () => {
          this.onCopyGithubUrl();
        }
      );
    },

    onCopyGithubUrl() {
      wx.setClipboardData({
        data: this.data.github,
        success: () => {
          wx.showToast({
            title: "Copied to clipboard",
            icon: "success",
            duration: 2000,
          });
        },
      });
    },

    onHideModal() {
      this.setData({
        showingModal: null,
      });
    },

    onActivityManageClick() {
      navigateToAdmin();
    },

    onSettingCompanyClick() {
      navigateToAuth();
    },

    onSponsorClick() {
      wx.reportEvent("sponsortap", {});
      this.setData({
        showingModal: "sponsor",
      });
    },

    onFeedbackClick() {
      this.setData({
        showingModal: "feedback",
      });
    },

    onDismissModal() {
      this.setData({
        showingModal: "",
      });
    },

    onCopyId() {
      const { userInfo } = this.data;
      wx.setClipboardData({
        data: userInfo.id,
      });
    },

    fetchUserInfo() {
      _fetchUserInfo().then((userInfo) => {
        userInfo.id = userInfo._openid.substring(0, 16);
        userInfo.isAdmin = userInfo.role === 1024;
        this.setData({
          userInfo,
        });

        if (userInfo.company) {
          fetchCompany(userInfo.company).then((company) => {
            this.setData({ company });
          });
        }
      });
    },

    onSelectAmount(e) {
      const amount = e.currentTarget.dataset.amount;
      wx.navigateTo({
        url: `/pages/user/sponsor/sponsor?amount=${amount}`,
      });
      this.onHideModal();
    },

    onOtherAmountClick() {
      wx.navigateTo({
        url: "/pages/user/sponsor/sponsor?type=otherAmount",
      });
      this.onHideModal();
    },

    fetchAllSponsors() {
      _fetchAllSponsors().then((res) => {
        const userLatestDonations = new Map();

        res.data.forEach((sponsor) => {
          const existingDonation = userLatestDonations.get(
            sponsor.user._openid
          );

          // If this user hasn't been seen yet or if this donation is more recent
          if (!existingDonation || sponsor.paidAt > existingDonation.paidAt) {
            userLatestDonations.set(sponsor.user._openid, sponsor);
          }
        });

        const uniqueSponsors = Array.from(userLatestDonations.values()).sort(
          (a, b) => b.paidAt - a.paidAt
        );

        this.setData({
          sponsors: uniqueSponsors,
        });
      });
    },

    onAvatarClick(e) {
      const userId = e.currentTarget.dataset.id;
      navigateToProfile(userId);
    },
  },

  pageLifetimes: {
    show() {
      this.fetchUserInfo();
    },
  },

  lifetimes: {
    attached() {
      wx.reportEvent("userpageload", {});
      this.fetchUserInfo();
      getAppConfig().then((config) => {
        const { featureFlags } = config;
        this.setData({
          sponsorPayEnabled: featureFlags.sponsorPay,
        });
      });
      this.fetchAllSponsors();
    },
  },
});
