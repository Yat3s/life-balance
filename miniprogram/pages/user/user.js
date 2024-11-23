import {
  fetchUserInfo as _fetchUserInfo,
  fetchCompany,
  updateUserInfo,
} from "../../repository/userRepo";
import {
  navigateToUserActivity,
  navigateToProfile,
  navigateToUserProduct,
  navigateToEditUserInfo,
  navigationToContribution,
  navigateToAdmin,
  navigateToAuth,
} from "../router";

Component({
  options: {
    addGlobalClass: true,
  },

  properties: {},

  data: {
    github: "https://github.com/Yat3s/life-balance",
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
    },
  },
});
