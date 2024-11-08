const userRepo = require('../../repository/userRepo');
const router = require('../router');

Component({
  options: {
    addGlobalClass: true,
  },

  properties: {},

  data: {},

  methods: {
    onActivityClick() {
      router.navigateToUserActivity();
    },

    onProfileClick() {
      router.navigateToProfile(this.data.userInfo._id);
    },

    onMallClick() {
      router.navigateToUserProduct();
    },

    onEditUserInfoClick() {
      router.navigateToEditUserInfo();
    },

    onContributionClick() {
      router.navigationToContribution();
    },

    onActivityManageClick() {
      router.navigateToAdmin();
    },

    onSettingCompanyClick() {
      router.navigateToAuth();
    },

    onSponsorClick() {
      this.setData({
        showingModal: 'sponsor',
      });
    },

    onFeedbackClick() {
      this.setData({
        showingModal: 'feedback',
      });
    },

    onDismissModal() {
      this.setData({
        showingModal: '',
      });
    },

    onCopyId() {
      const { userInfo } = this.data;
      wx.setClipboardData({
        data: userInfo.id,
      });
    },
  },

  pageLifetimes: {
    show() {},
  },

  lifetimes: {
    attached() {
      userRepo.fetchUserInfo().then((userInfo) => {
        userInfo.id = userInfo._openid.substring(0, 16);
        this.setData({
          userInfo,
        });

        if (userInfo.company) {
          userRepo.fetchCompany(userInfo.company).then((company) => {
            this.setData({ company });
          });
        }
      });
    },
  },
});
