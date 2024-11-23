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
      let cardConfig = {
        title: "最新圈子",
        cardTitle: "",
        description: "",
        members: [],
        memberCount: 0,
        showDescription: false,
        showAvatars: false,
        showMemberCount: false,
        onEventCardClick: null,
      };
      fetchLatestWechatGroups().then((circles) => {
        if (circles.length > 0) {
          cardConfig.cardTitle = circles[0].name;
          cardConfig.description = circles[0].tagStr;
          cardConfig.members = circles[0].members;
          cardConfig.memberCount = circles[0].memberCount;
          cardConfig.showDescription = true;
          cardConfig.showAvatars = false;
          cardConfig.showMemberCount = true;
          this.setData({
            latestCircle: circles[0],
            cardConfig,
          });
        } else {
          cardConfig.emptyTip = "暂无群组";
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
    handleLatestCircleClick() {
      wx.redirectTo({
        url: "/pages/index/index?page=connection",
      });
    },
  },
});
