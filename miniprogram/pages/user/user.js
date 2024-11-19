import {
  fetchUserInfo as _fetchUserInfo,
  fetchCompany,
} from '../../repository/userRepo';
import {
  navigateToUserActivity,
  navigateToProfile,
  navigateToUserProduct,
  navigateToEditUserInfo,
  navigationToContribution,
  navigateToAdmin,
  navigateToAuth,
} from '../router';

Component({
  options: {
    addGlobalClass: true,
  },

  properties: {},

  data: {},

  methods: {
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
      navigationToContribution();
    },

    onActivityManageClick() {
      navigateToAdmin();
    },

    onSettingCompanyClick() {
      navigateToAuth();
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
      this.fetchUserInfo();
    },
  },
});
