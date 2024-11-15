import { fetchLatestActivity } from "../../repository/dashboardRepo";

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
      fetchLatestActivity().then((latestActivity) => {
        this.setData({
          latestActivity: latestActivity[0],
        });
      });
    },
  },

  /**
   * Component methods
   */
  methods: {
    onUpcomingActivityClick() {
      wx.redirectTo({
        url: "/pages/index/index?page=connection",
      });
    },
  },
});
