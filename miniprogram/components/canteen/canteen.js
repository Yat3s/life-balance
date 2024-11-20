import { navigateToFoodMenu } from '../../pages/router';
import {
  fetchCanteenStatus,
  fetchFoodMenus,
} from '../../repository/dashboardRepo';

Component({
  options: {
    addGlobalClass: true,
  },
  properties: {},
  data: {},

  lifetimes: {
    attached() {
      fetchFoodMenus('b25').then((menus) => {
        if (!menus || menus.length === 0) {
          return;
        }

        const todayMenu = menus[0];
        todayMenu.dateStr = new Date(todayMenu.date).mmdd();

        this.setData({
          todayMenuB25: todayMenu,
        });
      });

      fetchFoodMenus('zhongmeng').then((menus) => {
        if (!menus || menus.length === 0) {
          return;
        }

        const todayMenu = menus[0];
        todayMenu.dateStr = new Date(todayMenu.date).mmdd();

        this.setData({
          todayMenuZhongmeng: todayMenu,
        });
      });
    },
  },

  methods: {
    toMenuDetail() {
      navigateToFoodMenu();
    },
  },
});
