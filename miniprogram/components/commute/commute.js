import { navigateToBusInfo } from "../../pages/router";
import {
  fetchParkingSpace, fetchParkingSpacePrediction
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

    fetchParkingData() {
      const {
        maxGroundSpaces,
        maxUndergroundSpaces,
      } = this.data;
      fetchParkingSpace().then(parkingSpace => {
        const groundSpaceIndicatorWidth = (parkingSpace.ground / maxGroundSpaces) * 100 + "%"
        const undergroundIndicatorWidth = (parkingSpace.underground / maxUndergroundSpaces) * 100 + "%"

        this.setData({
          parkingSpace,
          groundSpaceIndicatorWidth,
          undergroundIndicatorWidth,
          loadingParkingSpace: false,
        })
      });

      // fetchParkingSpacePrediction().then(parkingSpacePrediction => {
      //   if (!parkingSpacePrediction) {
      //     return;
      //   }

      //   console.log(parkingSpacePrediction);

      //   if ((parkingSpacePrediction.ground >= 60 && parkingSpacePrediction.underground >= 60) || (parkingSpacePrediction.ground == 0.0 && parkingSpacePrediction.underground == 0.0)) {
      //     return;
      //   }
        

      //   const now = new Date();
      //   const undergroundFullTime = now.addMinutes(parkingSpacePrediction.underground).hhmm();
      //   const groundFullTime = now.addMinutes(parkingSpacePrediction.ground).hhmm();
      //   this.setData({
      //     undergroundFullTime,
      //     groundFullTime
      //   })
      // })
    }
  }
})