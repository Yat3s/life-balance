import { fetchLatestWechatGroups } from "../../repository/dashboardRepo";

Component({
  options: {
    addGlobalClass: true,
  },
  /**
   * Component properties
   */
  properties: {},

  /**
   * Component initial data
   */
  data: {},

  lifetimes: {
    attached() {
      fetchLatestWechatGroups().then((latestWechatGroups) => {
        this.setData({
          latestCircle: latestWechatGroups[0],
        });
      });
    },
  },

  /**
   * Component methods
   */
  methods: {
    onLatestCircleClick() {
      wx.redirectTo({
        url: "/pages/index/index?page=connection",
      });
    },
  },
});
