import { getWeekdayIndexStr } from "../../common/util";
import {
  navigateToBusInfo,
  navigationToAppConfigWebView,
} from "../../pages/router";
import {
  fetchLastWeekParkingFullTime,
  fetchParkingSpace,
} from "../../repository/dashboardRepo";

const EMPTY_COLOR = "#3679EE";
const BUSY_COLOR = "#FF593B";
const SPIN_DURATION = 0.3

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
      },
      zhongmeng: {
        remaining: 223,
        usedPercent: 0,
        initialColor: EMPTY_COLOR,
        finalColor: EMPTY_COLOR,
      },
    },
  },

  lifetimes: {
    attached() {
      this.fetchParkingData();
      this.fetchParkingSpacePredictionData();
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

    fetchParkingSpacePredictionData() {
      fetchLastWeekParkingFullTime().then((res) => {
        let lastParkingFullTimeStr = "";
        let dayStrPrefix = "上周" + getWeekdayIndexStr(new Date());
        const showParkingFullTip = res != null;
        if (res) {
          const lastParkingFullTime = new Date(res).hhmm();
          lastParkingFullTimeStr = `${dayStrPrefix} B25 停满时间：${lastParkingFullTime}`;
        } else {
          lastParkingFullTimeStr = `${dayStrPrefix} B25 车位充足`;
        }
        this.setData({
          showParkingFullTip,
          lastParkingFullTimeStr,
        });
      });
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
            progressDuration: SPIN_DURATION,
            colorChangeDuration: 1.9,
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
