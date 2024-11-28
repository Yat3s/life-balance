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
      this.setData({
        user,
        hasUserInfo,
      });
    });

    fetchUserActivities(id).then((activities) => {
      console.log("fetchUserActivities", activities);
      activities.forEach((activity) => {
        activity.isOrganizer = activity.organizer._id === id;
        activity.createDateStr = formatDate(activity._createTime);
      });
      this.setData({
        activities,
      });
    });
  },

  onPhotoClick(e) {
    wx.previewImage({
      urls,
    });
  },

  onActivityItemClicked(e) {
    const id = e.currentTarget.dataset.id;
    navigateToActivityDetail(id);
  },

  onShareAppMessage() {},

  onShareTimeline() {},
});
