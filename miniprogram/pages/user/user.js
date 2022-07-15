const app = getApp();
const activityRepo = require('../../repository/activityRepo');
const userRepo = require('../../repository/userRepo');
const router = require('../router');

Component({
  options: {
    addGlobalClass: true
  },

  /**
   * 组件的属性列表
   */
  properties: {

  },

  /**
   * 组件的初始数据
   */
  data: {

  },

  /**
   * 组件的方法列表
   */
  methods: {
    onActivityClick(e) {
      router.navigateToUserActivity();
    },

    onProfileClick(e) {
      router.navigateToProfile(this.data.userInfo._id);
    },

    onEditUserInfoClick(e) {
      router.navigateToEditUserInfo();
    },

    onActivityManageClick() {
      router.navigateToAdmin();
    },
    onSettingCompanyClick() {
      router.navigateToAuth();
    }, 
    
    onSponsorClick() {
      this.setData({
        showingModal: 'sponsor'
      })
    },

    onFeedbackClick() {
      this.setData({
        showingModal: 'feedback'
      })
    },

    onDismissModal() {
      this.setData({
        showingModal: ''
      })
    },

    onCopyId() {
      const { userInfo } = this.data;
      wx.setClipboardData({
        data: userInfo.id,
      });
    }
  },

  pageLifetimes: {
    show() {

    }
  },
  lifetimes: {
    attached() {
      userRepo.fetchUserInfo().then(userInfo => {
        userInfo.id = userInfo._openid.substring(0, 16);
        this.setData({
          userInfo
        })

        if (userInfo.company) {
          userRepo.fetchCompany(userInfo.company).then(company => {
            this.setData({company})
          })
        }
      })
    }
  }
})