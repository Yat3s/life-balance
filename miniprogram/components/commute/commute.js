import { navigateToBusInfo, navigationToParkingTip } from "../../pages/router";
import {
  fetchParkingSpace, fetchParkingSpacePrediction, recordParkingFull
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
    maxGroundSpaces: 65,
    maxUndergroundSpaces: 308,
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
      fetchParkingSpacePrediction().then(res => {
        if (!res) {
          return;
        }

        const predictFullTime = (new Date(res)).hhmm();
        console.log("fetchParkingSpacePredictionData", predictFullTime);
        this.setData({
          predictFullTime
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

        const leftSpace = parkingSpace.ground + parkingSpace.underground;
        if (leftSpace == 0) {
          recordParkingFull(Date.now());
        } else if (leftSpace <= 10) {
          recordParkingFull(null, null, Date.now());
        } else if (leftSpace <= 20) {
          recordParkingFull(null, Date.now(), null);
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