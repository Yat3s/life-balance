import { getWeekdayIndexStr } from "../../common/util";
import {
  navigateToBusInfo,
  navigationToAppConfigWebView,
} from "../../pages/router";
import {
  fetchLastWeekParkingFullTime,
  fetchParkingSpace,
  recordParkingFull,
} from "../../repository/dashboardRepo";

const EMPTY_COLOR = "#3679EE";
const BUSY_COLOR = "#FF593B";
const SPIN_DURATION = 0.3;
const COLOR_CHANGE_DURATION = 0.6;
const SPACES_PER_INDICATOR = 45;
const MIN_INDICATOR_DISPLAY_USED_PERCENT = 97;

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
        remainingIndicatorCount: 0,
        indicators: [],
      },
      zhongmeng: {
        remaining: 223,
        usedPercent: 0,
        initialColor: EMPTY_COLOR,
        finalColor: EMPTY_COLOR,
        remainingIndicatorCount: 0,
        indicators: [],
      },
    },
  },

  lifetimes: {
    attached() {
      this.initIndicators();
      this.fetchParkingData();
      this.fetchParkingSpacePredictionData();
    },
  },

  methods: {
    initIndicators() {
      const { parkingConfig } = this.data;
      const b25IndicatorCount = Math.round(
        parkingConfig.b25.maxSpaces / SPACES_PER_INDICATOR
      );
      const zhongmengIndicatorCount = Math.round(
        parkingConfig.zhongmeng.maxSpaces / SPACES_PER_INDICATOR
      );
      this.setData({
        "parkingSpace.b25.indicatorCount": b25IndicatorCount,
        "parkingSpace.zhongmeng.indicatorCount": zhongmengIndicatorCount,
      });
    },
    refresh() {
      this.initIndicators();
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
        if (res) {
          const lastParkingFullTime = new Date(res).hhmm();
          lastParkingFullTimeStr = `${dayStrPrefix} B25 停满时间：${lastParkingFullTime}`;
        } else {
          lastParkingFullTimeStr = `${dayStrPrefix} B25 车位充足`;
        }
        this.setData({
          lastParkingFullTimeStr,
        });
      });
    },

    fetchParkingData() {
      fetchParkingSpace().then((parkingSpaceData) => {
        const updatedParkingData = {};
        Object.keys(this.data.parkingConfig).forEach((key) => {
          const maxSpaces = this.data.parkingConfig[key].maxSpaces;
          const indicatorCount = this.data.parkingSpace[key].indicatorCount;
          const remaining = parkingSpaceData[key];
          const used = maxSpaces - remaining;
          const usedPercent =
            Math.floor((used / maxSpaces) * 100) >=
              MIN_INDICATOR_DISPLAY_USED_PERCENT &&
            Math.floor((used / maxSpaces) * 100) < 100
              ? MIN_INDICATOR_DISPLAY_USED_PERCENT
              : Math.floor((used / maxSpaces) * 100);
          const remainingPercent = Math.floor((remaining / maxSpaces) * 100);

          updatedParkingData[key] = {
            remaining,
            used,
            usedPercent,
            remainingPercent,
            initialColor: EMPTY_COLOR,
            finalColor: usedPercent >= 90 ? BUSY_COLOR : EMPTY_COLOR,
            indicatorCount,
          };
        });

        // record parking full
        const now = new Date();
        if (now.getHours() >= 9 && now.getHours() <= 13) {
          const leftSpace = parkingSpaceData.b25;
          if (leftSpace <= 3) {
            recordParkingFull(Date.now());
          } else if (leftSpace <= 10) {
            recordParkingFull(null, null, Date.now());
          } else if (leftSpace <= 20) {
            recordParkingFull(null, Date.now(), null);
          }
        }

        this.setData({
          parkingSpace: updatedParkingData,
          loadingParkingSpace: false,
        });
      });
    },
  },
});
