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
      fetchLatestWechatGroups().then((circles) => {
        this.setData({
          latestCircle: circles[0],
          cardConfig: {
            title: "Latest Circle",
            cardTitle: circles[0].name,
            description: circles[0].tagStr,
            members: [],
            memberCount: circles[0].memberCount,
            showDescription: true,
            showAvatars: false,
            showMemberCount: true,
          },
        });
      });
    },
  },

  /**
   * Component methods
   */
  methods: {
    handleLatestCircleClick() {
      wx.redirectTo({
        url: "/pages/index/index?page=connection",
      });
    },
  },
});
