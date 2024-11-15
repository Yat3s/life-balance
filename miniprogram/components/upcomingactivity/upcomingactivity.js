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
      fetchUpcomingActivity().then((activities) => {
        this.setData({
          upcomingActivity: activities[0],
          cardConfig: {
            title: "Upcoming Activity",
            cardTitle: activities[0].title,
            description:
              activities[0].startDateStr + " - " + activities[0].location.name,
            members: activities[0].participants,
            memberCount: activities[0].maxParticipant,
            showDescription: true,
            showAvatars: true,
            showMemberCount: false,
          },
        });
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
