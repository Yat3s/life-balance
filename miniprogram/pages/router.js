const app = getApp();
const userRepo = require("../repository/userRepo");
export const AUTH_ORIGIN_DRAFT_ACTIVITY = "origin_draft_activity";
export const AUTH_ORIGIN_ACTIVITY_DETAIL = "origin_activity_detail";

export const Pages = {
  Auth: {
    authRequired: false,
    url: "/pages/auth/auth?origin=",
  },
  UserInfo: {
    authRequired: true,
    url: "/pages/user/userinfo/userinfo",
  },
  ActivityDetail: {
    authRequired: false,
    url: "/pages/activity/activitydetail/activitydetail?id=",
  },
  ActivityListPage: {
    authRequired: false,
    url: "/pages/activity/activitypage",
  },
  DraftNewActivity: {
    authRequired: true,
    url: "/pages/activity/draftactivity/draftactivity?type=new",
  },
  EditActivity: {
    authRequired: true,
    url: "/pages/activity/draftactivity/draftactivity?type=edit&id=",
  },
  RepostActivity: {
    authRequired: true,
    url: "/pages/activity/draftactivity/draftactivity?type=repost&id=",
  },
  PostCarpool: {
    authRequired: true,
    url: "/pages/carpool/postcarpool/postcarpool",
  },
  WechatGroups: {
    authRequired: true,
    url: "/pages/home/wechatgroup/wechatgroup",
  },
  FoodMenu: {
    authRequired: true,
    url: "/pages/home/foodmenu/foodmenu",
  },
  Howto: {
    authRequired: true,
    url: "/pages/home/howto/howto",
  },
  HowtoDetail: {
    authRequired: true,
    url: "/pages/home/howto/howtodetail/howtodetail?id=",
  },
  WeworkParking: {
    authRequired: true,
    url: "/pages/home/weworkparking/weworkparking",
  },
  Profile: {
    authRequired: true,
    url: "/pages/user/profile/profile?&id=",
  },
  UserActivity: {
    authRequired: true,
    url: "/pages/user/useractivity/useractivity",
  },
  BusInfo: {
    authRequired: true,
    url: "/pages/bus/bus",
  },
  Meal: {
    authRequired: false,
    url: "/pages/meal/meal",
  },
  CanteenTableSharing: {
    authRequired: true,
    url: "/pages/meal/tablesharing/tablesharing",
  },
  Glossary: {
    authRequired: true,
    url: "/pages/tools/glossary/glossary",
  },
  Contribution: {
    authRequired: false,
    url: "/pages/user/contribution/contribution",
  },
  AppConfigWebView: {
    authRequired: false,
    url: "/pages/appconfigwebview/appconfigwebview?config=",
  },
  PublishItem: {
    authRequired: false,
    url: "/pages/mall/publish-item/publish-item",
  },
  Purchase: {
    authRequired: false,
    url: "/pages/mall/purchase/purchase?id=",
  },
  UserProduct: {
    authRequired: false,
    url: "/pages/user/user-product/user-product",
  },
  UserOrder: {
    authRequired: false,
    url: "/pages/user/user-order/user-order?id=",
  },
  Onboarding: {
    authRequired: false,
    url: "/pages/onboarding/onboarding",
  },
  AddCircle: {
    authRequired: true,
    url: "/pages/circle/addcircle/addcircle",
  },
  Perk: {
    authRequired: true,
    url: "/pages/perk/perk",
  },
  PerkDetail: {
    authRequired: true,
    url: "/pages/perk/perkdetail/perkdetail?id=",
  },
  LuckDraw: {
    authRequired: true,
    url: "/pages/luck-draw/luck-draw?id=",
  },
  LuckDrawHistory: {
    authRequired: true,
    url: "/pages/luck-draw/history/history?id=",
  },
  CMS: {
    authRequired: true,
    companyRequired: true,
    url: "/pages/cms/cms",
  },
  FeatureFlagManagement: {
    authRequired: true,
    companyRequired: true,
    url: "/pages/cms/featureflagmanagement/featureflagmanagement",
  },
  VerificationManagement: {
    authRequired: true,
    companyRequired: true,
    url: "/pages/cms/verificationmanagement/verificationmanagement",
  },
};

export function navigationToAppConfigWebView(config) {
  navigate(Pages.AppConfigWebView, config);
}

export function navigationToContribution() {
  navigate(Pages.Contribution);
}

export function navigateToGlossary() {
  navigate(Pages.Glossary);
}

export function navigateToActivityPage() {
  navigate(Pages.ActivityListPage);
}

export function navigateToBusInfo() {
  navigate(Pages.BusInfo);
}

export function navigateToActivityDetail(activityId) {
  navigate(Pages.ActivityDetail, activityId);
}

export function navigateToWechatGroup() {
  navigate(Pages.WechatGroups);
}

export function navigateToDraftActivity() {
  navigate(Pages.DraftNewActivity);
}

export function navigateToEditActivity(activityId) {
  navigate(Pages.EditActivity, activityId);
}

export function navigateToRepostActivity(activityId) {
  navigate(Pages.RepostActivity, activityId);
}

export function navigateToAuth(origin) {
  navigate(Pages.Auth, origin);
}

export function navigateToPostCarpool() {
  navigate(Pages.PostCarpool);
}

export function navigateToFoodMenu() {
  navigate(Pages.FoodMenu);
}

export function navigateToMeal() {
  navigate(Pages.Meal);
}

export function navigateToCanteenTableSharing() {
  navigate(Pages.CanteenTableSharing);
}

export function navigateToHowTo() {
  navigate(Pages.Howto);
}

export function navigateToHowToDeatil(id) {
  navigate(Pages.HowtoDetail, id);
}

export function navigateToWeworkParking() {
  navigate(Pages.WeworkParking);
}

export function navigateToProfile(id) {
  navigate(Pages.Profile, id);
}

export function navigateToEditUserInfo() {
  navigate(Pages.UserInfo);
}

export function navigateToUserActivity() {
  navigate(Pages.UserActivity);
}

export function navigateToPublishItem() {
  navigate(Pages.PublishItem);
}

export function navigateToPurchase(id) {
  navigate(Pages.Purchase, id);
}

export function navigateToUserProduct() {
  navigate(Pages.UserProduct);
}

export function navigateToUserOrder(id) {
  navigate(Pages.UserOrder, id);
}

export function navigateToOnboarding() {
  navigate(Pages.Onboarding);
}

export function navigateToAddCircle() {
  navigate(Pages.AddCircle);
}

export function navigateToPerk() {
  navigate(Pages.Perk);
}

export function navigateToPerkDetail(partnerMerchantId) {
  navigate(Pages.PerkDetail, partnerMerchantId);
}

export function navigateToLuckDrawHistory(luckDrawId) {
  navigate(Pages.LuckDrawHistory, luckDrawId);
}

export function navigateToLuckDraw(luckDrawId) {
  navigate(Pages.LuckDraw, luckDrawId);
}

export function navigateToCMS() {
  navigate(Pages.CMS);
}

export function navigateToFeatureFlagManagement() {
  navigate(Pages.FeatureFlagManagement);
}

export function navigateToVerificationManagement() {
  navigate(Pages.VerificationManagement);
}

export function navigate(page, urlParam = null) {
  if (!page || !page.url) {
    return;
  }

  const url = urlParam ? page.url + urlParam : page.url;
  if (!page.authRequired) {
    wx.navigateTo({
      url,
    });
    return;
  }

  userRepo
    .fetchUserInfoOrSignup()
    .then((user) => {
      let navUrl = url;
      if (page.companyRequired && !user.company) {
        navUrl = "/pages/auth/auth";
      }
      wx.navigateTo({
        url: navUrl,
      });
    })
    .catch((err) => {
      wx.showToast({
        icon: "none",
        title: "Don't allow anonymous operation",
      });
    });
}
