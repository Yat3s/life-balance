const app = getApp();
const userRepo = require('../repository/userRepo');
const AUTH_ORIGIN_DRAFT_ACTIVITY = 'origin_draft_activity';
const AUTH_ORIGIN_ACTIVITY_DETAIL = 'origin_activity_detail';


const Pages = {
  Auth: {
    authRequired: false,
    url: '/pages/auth/auth?origin='
  },

  UserInfo: {
    authRequired: true,
    url: '/pages/profile/userinfo/userinfo'
  },

  DraftNewActivity: {
    authRequired: true,
    url: '/pages/activity/draftactivity/draftactivity?type=new'
  },

  EditActivity: {
    authRequired: true,
    url: '/pages/activity/draftactivity/draftactivity?type=edit&id='
  },
}

function navigateToDraftActivity() {
  this.navigate(Pages.DraftNewActivity)
}

function navigateToEditActivity(activityId) {
  this.navigate(Pages.EditActivity, activityId)
}

function navigateToAuth(origin) {
  this.navigate(Pages.Auth, origin)
}

function navigate(page, urlParam = null) {
  if (!page || !page.url) {
    return;
  }

  const url = urlParam ? page.url + urlParam : page.url;
  if (page.authRequired) {
    if (app.globalData.userInfo) {
      wx.navigateTo({
        url
      })
    } else {
      userRepo.fetchUserInfoOrSignup().then(user => {
        wx.navigateTo({
          url
        });
      }).catch(err => {
        wx.showToast({
          icon: 'none',
          title: '暂不支持匿名进行该操作',
        })
      });
    }
  } else {
    wx.navigateTo({
      url
    });
  }
}

module.exports = {
  AUTH_ORIGIN_DRAFT_ACTIVITY,
  AUTH_ORIGIN_ACTIVITY_DETAIL,
  Pages,


  navigate,
  navigateToAuth,
  navigateToEditActivity,
  navigateToDraftActivity,
};

