import { fetchUpcomingActivity } from "../../repository/dashboardRepo";

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
      let cardConfig = {
        title: "最新活动",
        cardTitle: "",
        description: "",
        members: [],
        memberCount: 0,
        showDescription: false,
        showAvatars: false,
        showMemberCount: false,
      };
      fetchUpcomingActivity().then((activities) => {
        if (activities.length > 0) {
          cardConfig.cardTitle = activities[0].title;
          cardConfig.description =
            activities[0].startDateStr + " - " + activities[0].location.name;
          cardConfig.members = activities[0].participants;
          cardConfig.memberCount = activities[0].maxParticipant;
          cardConfig.showDescription = true;
          cardConfig.showAvatars = true;
          cardConfig.showMemberCount = false;
          this.setData({
            upcomingActivity: activities[0],
            cardConfig,
          });
        } else {
          cardConfig.emptyTip = "暂无进行中活动";
          this.setData({
            cardConfig,
          });
        }
      });
    },
  },

  /**
   * Component methods
   */
  methods: {
    handleUpcomingActivityClick() {
      wx.redirectTo({
        url: "/pages/index/index?page=connection",
      });
    },
  },
});
