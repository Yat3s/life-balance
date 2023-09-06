import {
  navigateToBusInfo,
  navigationToParkingTip
} from "../../pages/router";
import {
  fetchLastParkingFullTime,
  fetchParkingSpace,
  fetchParkingSpacePrediction,
  recordParkingFull
} from "../../repository/dashboardRepo"

// components/commute/commute.js
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
    maxGroundSpaces: 0,
    maxUndergroundSpaces: 512,
    groundSpaceIndicatorWidth: "100%",
    undergroundIndicatorWidth: "100%",
    loadingParkingSpace: true,
  },

  lifetimes: {
    attached() {
      this.fetchParkingData();
      this.fetchParkingSpacePredictionData();
    },
  },

  pageLifetimes: {

  },

  /**
   * 组件的方法列表
   */
  methods: {
    refresh() {
      this.setData({
        loadingParkingSpace: true,
      })
      this.fetchParkingData();
    },

    toShuttleBusDetail() {
      navigateToBusInfo();
    },

    toParkingTip() {
      navigationToParkingTip();
    },

    fetchParkingSpacePredictionData() {
      // fetchParkingSpacePrediction().then(res => {
      //   if (!res) {
      //     return;
      //   }

      //   const predictFullTime = (new Date(res)).hhmm();
      //   console.log("fetchParkingSpacePredictionData", predictFullTime);
      //   this.setData({
      //     predictFullTime
      //   })
      // })

      fetchLastParkingFullTime().then(res => {
        let lastParkingFullTimeStr = ""
        let dayStrPrefix = (new Date()).getDay() == 1 ? '上周五' : '昨日'
        const showParkingFullTip = res != null
        if (res) {
          const lastParkingFullTime = (new Date(res)).hhmm();
          lastParkingFullTimeStr = `${dayStrPrefix}停满时间：${lastParkingFullTime}`
        } else {
          lastParkingFullTimeStr = `${dayStrPrefix}车位充足`
        }
        this.setData({
          showParkingFullTip,
          lastParkingFullTimeStr
        })
      })
    },

    fetchParkingData() {
      const {
        maxGroundSpaces,
        maxUndergroundSpaces,
      } = this.data;
      fetchParkingSpace().then(parkingSpace => {
        console.log("parkingSpace", parkingSpace);
        const groundSpaceIndicatorWidth = (parkingSpace.ground / maxGroundSpaces) * 100 + "%"
        const undergroundIndicatorWidth = (parkingSpace.underground / maxUndergroundSpaces) * 100 + "%"


        const now = new Date();
        if (now.getHours() >= 9 && now.getHours() <= 13) {
          const leftSpace = parkingSpace.ground + parkingSpace.underground;
          if (leftSpace <= 3) {
            recordParkingFull(Date.now());
          } else if (leftSpace <= 10) {
            recordParkingFull(null, null, Date.now());
          } else if (leftSpace <= 20) {
            recordParkingFull(null, Date.now(), null);
          }
        }

        this.setData({
          parkingSpace,
          groundSpaceIndicatorWidth,
          undergroundIndicatorWidth,
          loadingParkingSpace: false,
        })
      });
    }
  }
})