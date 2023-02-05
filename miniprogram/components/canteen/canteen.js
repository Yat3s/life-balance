import { navigateToFoodMenu } from "../../pages/router";
import { fetchCanteenStatus, fetchFoodMenus } from "../../repository/dashboardRepo"

// components/canteen/canteen.js
Component({
  options: {
    addGlobalClass: true
  },
  /**
   * 组件的属性列表
   */
  properties: {

  },

  /**
   * 组件的初始数据
   */
  data: {

  },

  lifetimes: {
    attached() {
      fetchCanteenStatus().then(canteenStatus => {
        this.setData({
          canteenStatus
        });
      });

      fetchFoodMenus('b25').then(menus => {
        if (!menus || menus.length === 0) {
          return;
        }

        const todayMenu = menus[0];
        todayMenu.dateStr = new Date(todayMenu.date).mmdd();

        this.setData({
          todayMenuB25: todayMenu,
        })
      });

      fetchFoodMenus('zhongmeng').then(menus => {
        if (!menus || menus.length === 0) {
          return;
        }

        const todayMenu = menus[0];
        todayMenu.dateStr = new Date(todayMenu.date).mmdd();

        this.setData({
          todayMenuZhongmeng: todayMenu,
        })
      });
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    toMenuDetail() {
      navigateToFoodMenu();
    }
  }
})
