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
const SPIN_DURATION = 0.3;
const COLOR_CHANGE_DURATION = 0.6;
const SPACES_PER_INDICATOR = 45;

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
      const b25Indicators = Array.from({ length: b25IndicatorCount }, () => ({
        active: false,
      }));
      const zhongmengIndicatorCount = Math.round(
        parkingConfig.zhongmeng.maxSpaces / SPACES_PER_INDICATOR
      );
      const zhongmengIndicators = Array.from(
        { length: zhongmengIndicatorCount },
        () => ({ active: false })
      );
      this.setData({
        "parkingSpace.b25.indicators": b25Indicators,
        "parkingSpace.zhongmeng.indicators": zhongmengIndicators,
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
      const { parkingSpace } = this.data;
      fetchParkingSpace().then((parkingSpaceData) => {
        console.log("parkingSpace", parkingSpaceData);

        const updatedParkingData = {};
        Object.keys(this.data.parkingConfig).forEach((key) => {
          const maxSpaces = this.data.parkingConfig[key].maxSpaces;
          const remaining = parkingSpaceData[key];
          const used = maxSpaces - remaining;
          const usedPercent = Math.round((used / maxSpaces) * 100);

          const remainingIndicatorCount = Math.floor(
            remaining / SPACES_PER_INDICATOR
          );
          const indicators =
            key === "b25"
              ? parkingSpace.b25.indicators
              : parkingSpace.zhongmeng.indicators;
          indicators.forEach((indicator, index) => {
            indicator.active = index < remainingIndicatorCount;
          });
          updatedParkingData[key] = {
            remaining,
            used,
            usedPercent,
            initialColor: EMPTY_COLOR,
            finalColor: usedPercent >= 90 ? BUSY_COLOR : EMPTY_COLOR,
            progressDuration: SPIN_DURATION,
            colorChangeDuration: COLOR_CHANGE_DURATION,
            remainingIndicatorCount,
            indicators,
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
