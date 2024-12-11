Component({
  properties: {
    className: {
      type: String,
      value: "",
    },
    userInfo: {
      type: Object,
      value: {},
    },
  },
  data: {},

  methods: {
    onTapUserAvatar(e) {
      wx.navigateTo({
        url: `/pages/user/profile/profile?id=${this.data.userInfo._id}`,
      });
    },
  },
});
