import { formatDate, formatNumberWithCommas } from "../../common/util";
import { navigateToFoodMenu } from "../../pages/router";
import { fetchFoodMenus } from "../../repository/dashboardRepo";

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
      fetchFoodMenus("b25").then((menus) => {
        if (!menus || menus.length === 0) {
          return;
        }
        

        const todayMenu = menus[0];

        console.log("b25", todayMenu.foodWaste);
        todayMenu.canteenName = "B25餐厅菜单";
        todayMenu.startDateStr = formatDate(todayMenu.startDate, false);
        todayMenu.endDateStr = formatDate(todayMenu.endDate, false);
        this.setData({
          todayMenuB25: todayMenu,
        });
      });

      fetchFoodMenus("zhongmeng").then((menus) => {
        if (!menus || menus.length === 0) {
          return;
        }

        const todayMenu = menus[0];
        todayMenu.canteenName = "中盟餐厅菜单";
        todayMenu.startDateStr = formatDate(todayMenu.startDate, false);
        todayMenu.endDateStr = formatDate(todayMenu.endDate, false);

        this.setData({
          todayMenuZhongmeng: todayMenu,
        });
      });
    },
  },

  /**
   * Component methods
   */
  methods: {
    toMenuDetail() {
      navigateToFoodMenu();
    },
    extractDates(str) {
      const regex = /(\d{1,2}月\d{1,2}日)/g;
      const matches = str.match(regex);

      return matches || [];
    },
  },
});
