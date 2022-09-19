const {
  dateDiff
} = require("../../common/util");
const {
  getAppConfig
} = require("../../repository/baseRepo");
const {
  fetchAllRoutes,
  fetchGpsLocation
} = require("../../repository/busRepo");
const {
  fetchParkingSpace,
  fetchStockData,
  fetchBuilding2Progress,
  fetchFoodMenus,
  fetchWeworkParkingBooking,
  fetchBanners
} = require("../../repository/dashboardRepo");
const {
  msftBoost
} = require("../../repository/exploreRepo");
const {
  fetchUserInfo
} = require("../../repository/userRepo");
const {
  navigateToWechatGroup,
  navigateToActivityDetail,
  navigateToFoodMenu,
  navigateToCanteenTableSharing,
  navigateToMeal,
  navigateToHowTo,
  navigateToBusInfo,
  navigateToWeworkParking,
  navigateToGlossary,
} = require("../router");

const app = getApp();
const COLLAPSED_SCROLL_TOP = 150;
const MIN_TITLE_SCALE = 0.75;
const MIN_AVATAR_SCALE = 0.75;
const MAX_APP_BAR_HEIGHT = 150; //px
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
    toolbarHeight: app.globalData.toolbarHeight,
    statusBarHeight: app.globalData.statusBarHeight,
    appBarHeight: MAX_APP_BAR_HEIGHT,
    loadingParkingSpace: false,
    building2StartDateStr: '2021/5/7',
    building2EndDateStr: '2023/6/30',
    canteenStartDateStr: '2021/11/19',
    canteenEndDateStr: '2022/1/30',
    activeBusCount: 0,
    bannerExpanded: false,
  },

  lifetimes: {
    attached() {
      const nowHours = (new Date()).getHours();
      let welcomeMessage = "";
      if (nowHours > 0 && nowHours < 5) {
        welcomeMessage = "It's time to sleep!"
      } else if (nowHours >= 5 && nowHours < 12) {
        welcomeMessage = "Good morning!"
      } else if (nowHours >= 12 && nowHours < 18) {
        welcomeMessage = "Good afternoon!"
      } else if (nowHours >= 18 && nowHours < 24) {
        welcomeMessage = "Good evening!"
      }

      this.setData({
        welcomeMessage
      })
      this.fetchDashboardData();
      this.fetchBanner();
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    onPageScrolled(e) {
      const scrollTop = Math.min(COLLAPSED_SCROLL_TOP, e.detail.scrollTop);
      const minAppbarHeight = app.globalData.toolbarHeight + app.globalData.statusBarHeight;
      const appBarHeight = MAX_APP_BAR_HEIGHT - (MAX_APP_BAR_HEIGHT - minAppbarHeight) * (scrollTop / COLLAPSED_SCROLL_TOP)
      const collapsed = appBarHeight == minAppbarHeight;
      if (this.data.collapsed === true && collapsed === true) {
        return
      }
      const titleScale = 1.0 - (scrollTop / COLLAPSED_SCROLL_TOP) * (1.0 - MIN_TITLE_SCALE);
      const avatarScale = 1.0 - (scrollTop / COLLAPSED_SCROLL_TOP) * (1.0 - MIN_AVATAR_SCALE);

      this.setData({
        titleScale,
        avatarScale,
        appBarHeight,
        collapsed
      })
      console.log(e);
    },

    onWechatGroupCardClick() {
      navigateToWechatGroup();
    },

    onActivityClick() {
      navigateToActivityDetail(this.data.popularActivity._id);
    },

    onFoodMenuClick() {
      navigateToFoodMenu();
    },

    onCanteenTableClick() {
      navigateToCanteenTableSharing();
    },

    onMealClick() {
      navigateToMeal();
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

    onGlossaryClicked() {
      navigateToGlossary();
    },
    onBannerClicked: function () {
      this.setData({
        bannerExpanded: !this.data.bannerExpanded
      });

      wx.reportEvent("bannertap", {
        "user_openid": this.data.userInfo._openid,
        "toexpand": `${this.data.bannerExpanded}`
      })
    },
    onBannerLinkClicked: function () {
      wx.setClipboardData({
        data: this.data.banner.link
      }), wx.showToast({
        title: "Link Copied"
      });

      wx.reportEvent("bannerbuttontap", {
        "user_openid": this.data.userInfo._openid,
      })
    },

    onMsftBoostClicked() {
      const {
        boosted
      } = this.data;
      if (boosted) {
        return;
      }
      msftBoost();
      this.setData({
        boosted: true,
        msftBoostCount: ++this.data.msftBoostCount
      })
    },

    onBuild2Click() {
      wx.previewImage({
        urls: [this.data.building2LatestProgress.picture]
      })
    },

    fetchBanner: function () {
      fetchBanners().then(res => {
        if (res && 0 != res.length) {
          this.setData({
            banner: res[0]
          })
        }
      });
    },

    fetchDashboardData() {
      this.setData({
        loadingParkingSpace: true
      })

      fetchUserInfo().then(userInfo => {
        this.setData({
          userInfo
        })
      })

      getAppConfig().then(config => {
        const allowedOrgs = config.features.weworkParking.allowedOrgs;
        let maxWeWorkPakingSpace = 0
        for (const org of allowedOrgs) {
          maxWeWorkPakingSpace += parseInt(org.maxParticipant);
        }

        const nowDate = new Date().toISOString().substring(0, 10).replaceAll("-", "/");
        const startTimeStr1 = config.features.shuttleBus.startTime1;
        const startTimeStr2 = config.features.shuttleBus.startTime2;
        const endTimeStr1 = config.features.shuttleBus.endTime1;
        const endTimeStr2 = config.features.shuttleBus.endTime2;

        const startTime1 = new Date(`${nowDate} ${startTimeStr1}`);
        const startTime2 = new Date(`${nowDate} ${startTimeStr2}`);
        const endTime1 = new Date(`${nowDate} ${endTimeStr1}`);
        const endTime2 = new Date(`${nowDate} ${endTimeStr2}`);
        const now = Date.now();
        const gpsAvailable = (now > startTime1.getTime() && now < endTime1.getTime()) ||
          (now > startTime2.getTime() && now < endTime2.getTime());

        if (gpsAvailable) {
          // Shuttle bus
          const siteId = "c9172ca4-94d8-600c-162d-429c84522021";
          fetchAllRoutes(siteId).then(routes => {
            const allRequests = [];
            for (const route of routes) {
              allRequests.push(fetchGpsLocation(route.id));
            }

            Promise.allSettled(allRequests).then(results => {
              let activeBusCount = 0;
              results.forEach((result) => {
                if (result.value && result.value.data) {
                  activeBusCount++
                }
              });

              this.setData({
                activeBusCount
              })
            })
          })
        }
        this.setData({
          notice: config.notice,
          maxWeWorkPakingSpace,
          msftBoostCount: config.msftBoostCount
        })
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

      // WeWork Parking
      fetchWeworkParkingBooking().then(bookings => {
        const bookingTodayEnd = 11;
        const booking = new Date().getHours() < bookingTodayEnd ? bookings[1] : bookings[0];
        const weWorkBookedParticipantCount = booking.participants ? booking.participants.length : 0;
        this.setData({
          weWorkBookedParticipantCount
        })
      })
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
  }
})