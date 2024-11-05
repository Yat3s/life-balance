import {
  navigateToBusInfo,
  navigationToAppConfigWebView,
} from '../../pages/router';
import {
  fetchLastWeekParkingFullTime,
  fetchParkingSpace,
  recordParkingFull,
} from '../../repository/dashboardRepo';
import { getWeekdayIndexStr } from '../../common/util';

Component({
  options: {
    addGlobalClass: true,
  },
  data: {
    maxB25Spaces: 508,
    maxZhongmengSpaces: 223,
    zhongmengSpaceIndicatorWidth: '100%',
    b25SpaceIndicatorWidth: '100%',
    loadingParkingSpace: true,
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
      navigationToAppConfigWebView('parkingTip');
    },

    toShuttleTip() {
      navigationToAppConfigWebView('shuttleTip');
    },

    fetchParkingSpacePredictionData() {
      fetchLastWeekParkingFullTime().then((res) => {
        let lastParkingFullTimeStr = '';
        let dayStrPrefix = '上周' + getWeekdayIndexStr(new Date());
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
      const { maxZhongmengSpaces, maxB25Spaces } = this.data;
      fetchParkingSpace().then((parkingSpace) => {
        console.log('parkingSpace', parkingSpace);
        const zhongmengSpaceIndicatorWidth =
          (parkingSpace.zhongmeng / maxZhongmengSpaces) * 100 + '%';
        const b25SpaceIndicatorWidth =
          (parkingSpace.b25 / maxB25Spaces) * 100 + '%';

        const now = new Date();
        if (now.getHours() >= 9 && now.getHours() <= 13) {
          const leftSpace = parkingSpace.b25;
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
          zhongmengSpaceIndicatorWidth,
          b25SpaceIndicatorWidth,
          loadingParkingSpace: false,
        });
      });
    },
  },
});
