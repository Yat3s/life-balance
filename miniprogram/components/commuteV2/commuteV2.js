import {
  navigateToBusInfo,
  navigationToAppConfigWebView,
} from "../../pages/router";
import { fetchParkingSpace } from "../../repository/dashboardRepo";

const EMPTY_COLOR = "#3679FF";
const BUSY_COLOR = "#FF593B";

Component({
  options: {
    addGlobalClass: true,
  },
  data: {
    parkingConfig: {
      b25: { maxSpaces: 508 },
      zhongmeng: { maxSpaces: 223 },
    },
    loadingParkingSpace: true,
    parkingSpace: {
      b25: {
        remaining: 508,
        usedPercent: 0,
        initialColor: EMPTY_COLOR,
        finalColor: EMPTY_COLOR,
        progressDuration: 1,
        colorChangeDuration: 2,
      },
      zhongmeng: {
        remaining: 223,
        usedPercent: 0,
        initialColor: EMPTY_COLOR,
        finalColor: EMPTY_COLOR,
        progressDuration: 1,
        colorChangeDuration: 2,
      },
    },
  },

  lifetimes: {
    attached() {
      this.fetchParkingData();
    },
  },

  methods: {
    refresh() {
      this.setData({
        loadingParkingSpace: true,
      });
      this.fetchParkingData();
    },

    toShuttleBusDetail() {
      navigateToBusInfo();
    },

    toParkingTip() {
      navigationToAppConfigWebView("parkingTip");
    },

    toShuttleTip() {
      navigationToAppConfigWebView("shuttleTip");
    },

    fetchParkingData() {
      fetchParkingSpace().then((parkingSpace) => {
        console.log("parkingSpace", parkingSpace);

        const updatedParkingData = {};
        Object.keys(this.data.parkingConfig).forEach((key) => {
          const maxSpaces = this.data.parkingConfig[key].maxSpaces;
          const remaining = parkingSpace[key];
          const used = maxSpaces - remaining;
          const usedPercent = Math.round((used / maxSpaces) * 100);

          updatedParkingData[key] = {
            remaining,
            used,
            usedPercent,
            initialColor: EMPTY_COLOR,
            finalColor: usedPercent >= 90 ? BUSY_COLOR : EMPTY_COLOR,
            progressDuration: usedPercent <= 30 ? 1 : usedPercent <= 60 ? 2 : 3,
            colorChangeDuration:
              usedPercent <= 30 ? 2 : usedPercent <= 60 ? 4 : 6,
          };
        });

        this.setData({
          parkingSpace: updatedParkingData,
          loadingParkingSpace: false,
        });
      });
    },
  },
});
