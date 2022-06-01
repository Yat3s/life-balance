const {
  dateDiff
} = require("../../common/util");
const {
  fetchParkingSpace,
  fetchStockData,
  fetchBuilding2Progress,
  fetchWechatGroupCount,
  fetchTheMostPopularActivity,
  fetchFoodMenus,
  fetchFaqCount,
  fetchWechatGroups
} = require("../../repository/dashboardRepo");
const {
  navigateToWechatGroup,
  navigateToActivityDetail,
  navigateToFoodMenu,
  navigateToHowTo,
  navigateToBusInfo,
  navigateToWeworkParking,
} = require("../router");

const BUILDING2_START_DATE = ""

// pages/home/home.js
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
    loadingParkingSpace: false,
    building2StartDateStr: '2021/5/7',
    building2EndDateStr: '2023/6/30',
    canteenStartDateStr: '2021/11/19',
    canteenEndDateStr: '2022/1/30',
    wechatGroupCount: 0,
  },

  lifetimes: {
    attached() {
      this.fetchDashboardData();
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    onWechatGroupCardClick() {
      navigateToWechatGroup();
    },

    onActivityClick() {
      navigateToActivityDetail(this.data.popularActivity._id);
    },

    onFoodMenuClick() {
      navigateToFoodMenu();
    },

    onHowToClick() {
      navigateToHowTo();
    },

    onBusClick() {
      navigateToBusInfo()
    },

    onWeworkParkingClick() {
      navigateToWeworkParking();
    },

    fetchDashboardData() {
      this.setData({
        loadingParkingSpace: true
      })

      // Parking space
      fetchParkingSpace().then(parkingSpace => {
        this.setData({
          parkingSpace,
          loadingParkingSpace: false
        })
      })

      // Stock
      fetchStockData().then(stockData => {
        console.log(stockData);
        const top1 = stockData.stocks[0];
        const top2 = stockData.stocks[1];
        const msft = stockData.msft;
        top1.mktcap = (top1.mktcap / 1000000000000).toFixed(2);
        top2.mktcap = (top2.mktcap / 1000000000000).toFixed(2);
        msft.mktcap = (msft.mktcap / 1000000000000).toFixed(2);
        msft.price = msft.price;
        stockData.msftTop1 = top1.symbol === 'MSFT';
        stockData.top1 = top1;
        stockData.top2 = top2;
        stockData.msft = msft;

        this.setData({
          stockData
        })
      })

      // Building2
      fetchBuilding2Progress().then(building2 => {
        const building2LatestProgress = building2[0];
        const createDate = new Date(building2LatestProgress._createTime);
        building2LatestProgress.createDateStr = `${createDate.dateStr()} ${createDate.hhmm()}`

        const {
          building2StartDateStr,
          building2EndDateStr
        } = this.data;
        const wholeDayDiff = dateDiff(new Date(building2EndDateStr), new Date(building2StartDateStr));
        const progressedDiff = dateDiff(new Date(), new Date(building2StartDateStr));
        const building2Progress = ((progressedDiff / wholeDayDiff) * 100).toFixed(2);

        this.setData({
          building2Progress,
          building2LatestProgress
        })
      })

      // Wechat groups
      fetchWechatGroups().then(groups => {
        groups.sort((a, b) => {
          return b._createTime - a._createTime;
        })

        let newGroupsStr = '';
        for (const group of groups) {
          newGroupsStr += group.name + "、"
        }
        
        this.setData({
          newGroupsStr
        })
      })

      fetchWechatGroupCount().then(data => {
        this.setData({
          wechatGroupCount: data.total
        })
      })

      // FAQ count
      fetchFaqCount().then(data => {
        this.setData({
          faqCount: data.total
        })
      })

      // Popular activity
      fetchTheMostPopularActivity().then(popularActivity => {
        this.setData({
          popularActivity
        })
      })

      // Food menu
      fetchFoodMenus().then(menus => {
        if (!menus || menus.length === 0) {
          return;
        }
        
        const todayMenu = menus[0];
        todayMenu.dateStr = new Date(todayMenu.date).mmdd();
        const {
          canteenStartDateStr,
          canteenEndDateStr
        } = this.data;
        const wholeDayDiff = dateDiff(new Date(canteenEndDateStr), new Date(canteenStartDateStr));
        const progressedDiff = dateDiff(new Date(), new Date(canteenStartDateStr));
        const canteenUpdateProgress = ((progressedDiff / wholeDayDiff) * 100).toFixed(2);

        this.setData({
          canteenUpdateProgress,
          todayMenu,
        })
      });
    },

    onRefreshParkingSpace() {
      this.setData({
        loadingParkingSpace: true
      })
      fetchParkingSpace().then(parkingSpace => {
        this.setData({
          parkingSpace,
          loadingParkingSpace: false
        })
      })
    },

    onBuild2Click() {
      wx.previewImage({
        urls: [this.data.building2LatestProgress.picture]
      })
    }
  }
})