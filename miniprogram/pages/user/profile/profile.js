const { formatDate } = require("../../../common/util");
const { fetchUserActivities } = require("../../../repository/activityRepo");
const {
  fetchUserProfile,
  fetchCompany,
} = require("../../../repository/userRepo");
const { navigateToActivityDetail } = require("../../router");

Page({
  data: {
    hasUserInfo: false,
  },

  onLoad(options) {
    const id = options.id;
    wx.showLoading();
    fetchUserProfile(id).then((user) => {
      console.log(user);
      if (user.birthday) {
        user.age =
          new Date().getFullYear() - parseInt(user.birthday.slice(0, 4));
        console.log(parseInt(user.birthday.slice(0, 4)));
      }
      if (user.company) {
        fetchCompany(user.company).then((company) => {
          this.setData({ company });
        });
      }
      // Check if user has any profile information
      const hasUserInfo = !!(
        user.height ||
        user.weight ||
        user.school ||
        user.occupation ||
        user.age
      );

      // Combine avatar and photos
      const combinedPhotos = user.photos
        ? [user.avatarUrl, ...user.photos]
        : [user.avatarUrl];

      this.setData({
        user,
        hasUserInfo,
        combinedPhotos,
      });
    });

    fetchUserActivities(id)
      .then((activities) => {
        console.log("fetchUserActivities", activities);
        activities.forEach((activity) => {
          activity.isOrganizer = activity.organizer._id === id;
          activity.createDateStr = formatDate(activity._createTime);
        });
        this.setData({
          activities,
        });
      })
      .finally(() => {
        wx.hideLoading();
      });
  },

  onPhotoClick(e) {
    wx.previewImage({
      urls: this.data.combinedPhotos,
      current: e.currentTarget.dataset.photo,
    });
  },

  onActivityItemClicked(e) {
    const id = e.currentTarget.dataset.id;
    navigateToActivityDetail(id);
  },

  onShareAppMessage() {},

  onShareTimeline() {},
});
