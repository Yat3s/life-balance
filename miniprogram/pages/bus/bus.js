import {
  fetchAllRoutes,
  fetchGpsLocation
} from "../../repository/busRepo"

const app = getApp();
const FETCH_GPS_INTERVAL = 4000;

const SITE_ID = "c9172ca4-94d8-600c-162d-429c84522021"
// pages/bus/bus.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    toolbarHeight: app.globalData.toolbarHeight,
    statusBarHeight: app.globalData.statusBarHeight,
    showMakerTitle: false,
    tipText: `1.已登记的长期乘坐的人员优先乘坐，临时乘坐的员工在座位有空余的情况下可以乘坐。
The registered long-term staff have the priority to take the shuttle. If you need to take the shuttle occasionally, you can also take it if there are any spare seats. 
    
2.长期乘坐班车的员工请在前台领取班车卡，上车时刷卡。临时乘坐的员工不需要领班车卡，上车时向司机出示微软 Badge 即可。
Please come to Reception to collect the shuttle card if you need to take the shuttle regularly, and swipe the shuttle card when getting on the bus. If you take the shuttle occasionally, no shuttle card is required, you can show your Microsoft badge to the driver.

3.由于各站点不允许长时间逗留，所以班车即停即走。为了避免错过班车，请提早 5 分钟到达站点候车。
Due to the station parking time limitation, our shuttle will leave bus stop immediately. To avoid missing the bus, please make sure to arrive at least 5 minutes ahead.

4.班车前挡风玻璃处将放置苏州微软标志以便大家辨认。
For your convenience, we will set Microsoft logo at shuttle bus front glass.`
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    fetchAllRoutes(SITE_ID).then(routes => {
      console.log(routes);

      // Sort by sequence
      routes.sort((a, b) => {
        return a.sequence - b.sequence
      })

      for (const route of routes) {
        if (!route.stations || route.stations.length == 0) {
          continue;
        }

        for (const station of route.stations) {
          station.headingTime = "N/A";
          station.backTime = "N/A";
          for (const schedule of station.schedules) {
            if (schedule.heading) {
              station.headingTime = schedule.time;
            } else {
              station.backTime = schedule.time;
            }
          }
        }
        route.firstStation = route.stations[0];
        route.lastStation = route.stations[route.stations.length - 1];
      }

      const selectedRouteIndex = 0;
      const selectedStationIndex = 0;
      const selectedRoute = routes[selectedRouteIndex];

      this.setData({
        routes,
        selectedRouteIndex,
        selectedRoute,
        selectedStationIndex,
      });

      this.getGpsLocationFirstLoad()
      this.updateStationMarkers(true);
      this.startGetGpsLocationWorker(selectedRoute.id);
    })
  },

  updateStationMarkers(updateIncludePoints) {
    const {
      selectedRoute,
      selectedStationIndex,
      showMakerTitle,
      busRealTimeLocation
    } = this.data;
    const markers = [];
    const includePoints = [];
    const selectedStation = selectedRoute.stations[selectedStationIndex];
    for (const station of selectedRoute.stations) {
      const display = showMakerTitle ? 'ALWAYS' : selectedStation.id == station.id ? 'ALWAYS' : 'BYCLICK';
      markers.push({
        id: station.position,
        latitude: station.latitude,
        longitude: station.longitude,
        callout: {
          content: station.nameCh,
          color: '#ffffff',
          bgColor: '#5f85e6',
          fontSize: 10,
          borderRadius: 4,
          padding: 8,
          display,
        }
      });

      includePoints.push({
        latitude: station.latitude,
        longitude: station.longitude,
      });
    }

    if (busRealTimeLocation) {
      markers.push({
        id: 10000,
        latitude: busRealTimeLocation.latitude,
        longitude: busRealTimeLocation.longitude,
        width: 30,
        height: 30,
        callout: {
          content: busRealTimeLocation.plateNum,
          color: '#000000',
          bgColor: '#f1f1f1',
          fontSize: 11,
          borderRadius: 4,
          padding: 8,
          display: "ALWAYS",
        },
        iconPath: "../../images/ic_bus_marker.png"
      });
    }

    const polyLines = [];
    polyLines.push({
      points: includePoints,
      color: '#4989c4',
      width: 2
    })
    this.setData({
      markers,
      polyLines
    });

    if (updateIncludePoints) {
      this.setData({
        includePoints
      });
    }
  },

  onSearchButtonClicked(e) {
    this.setData({
      showingModal: 'search'
    });
  },

  onDismissModal() {
    this.setData({
      showingModal: ''
    });
  },

  onSearchItemClicked(e) {
    this.onDismissModal()

    const searchResult = e.currentTarget.dataset.result;
    this.routeSelect(searchResult.routeIndex, searchResult.stationIndex, true)

    this.setData({
      searchResults: [],
      searchText: ""
    })
  },

  onSearchTextChanged(e) {
    const text = e.detail.value.toLowerCase();
    const {
      routes
    } = this.data;
    const searchResults = []
    for (const [routeIndex, route] of routes.entries()) {

      // Search by route name
      const routeName = route.nameCh + route.nameEn;
      if (routeName.search(text) != -1) {
        searchResults.push({
          route,
          routeIndex,
          stationIndex: 0,
          hint: "",
        })
      } else {
        // Search by station name
        for (const [stationIndex, station] of route.stations.entries()) {
          const stationName = station.nameCh + "/" + station.nameEn;
          if (stationName.search(text) != -1) {
            searchResults.push({
              route,
              routeIndex,
              stationIndex,
              hint: stationName,
            })
            break;
          }
        }
      }
    }

    this.setData({
      searchResults,
      searchText: text
    })
  },

  onMapMarkerClicked(e) {
    const markerId = e.markerId;
    let {
      selectedRoute,
      selectedStationIndex
    } = this.data;
    for (let [index, station] of selectedRoute.stations.entries()) {
      if (station.position === markerId) {
        selectedStationIndex = index;
        break;
      }
    }

    const scrollToStationId = selectedRoute.stations[selectedStationIndex].id;

    this.setData({
      selectedStationIndex,
      scrollToStationId,
    });

    this.updateStationMarkers(false);
  },

  onShowAllMarkerTitleChanged(e) {
    console.log(e);
    const showMakerTitle = e.detail.value;
    this.setData({
      showMakerTitle
    });

    this.updateStationMarkers(false);
  },

  getGpsLocationFirstLoad() {
    let {
      routes
    } = this.data;
    const allRequests = [];
    for (const route of routes) {
      allRequests.push(fetchGpsLocation(route.id));
    }
    let routeIdx = 0
    Promise.allSettled(allRequests).then(results => {
      results.forEach((result) => {
        routes[routeIdx].gps = result.value
        routeIdx++;
      });

      this.setData({
        routes
      })
    })
  },

  startGetGpsLocationWorker(routeId) {
    const { lastIntervalId } = this.data;
    if (lastIntervalId) {
      clearInterval(lastIntervalId);
    }
    // Start immediately
    this.getGpsLocation(routeId);

    const intervalId = setInterval(() => {
      this.getGpsLocation(routeId);
    }, FETCH_GPS_INTERVAL);

    this.setData({
      lastIntervalId: intervalId
    })
  },

  getGpsLocation(routeId) {
    fetchGpsLocation(routeId).then(res => {
      console.log(routeId, res);
      const busRealTimeLocation = res.data ? res.data : null
      this.setData({
        busRealTimeLocation
      });

      this.updateStationMarkers(false);
    })
  },

  routeSelect(selectedRouteIndex, selectedStationIndex, needScrollToRoute = false) {
    const selectedRoute = this.data.routes[selectedRouteIndex];
    const selectedStation = selectedRoute.stations[selectedStationIndex];
    let scrollToRouteId = ''
    if (needScrollToRoute) {
      scrollToRouteId = selectedRoute.id;
    }
    const scrollToStationId = selectedStation.id;
    const selectedStationLatitude = selectedStation.latitude;
    const selectedStationLongitude = selectedStation.longitude;
    this.setData({
      selectedRouteIndex,
      selectedRoute,
      scrollToRouteId,
      selectedStationIndex,
      scrollToStationId,
      selectedStationLatitude,
      selectedStationLongitude
    });

    this.updateStationMarkers(true);
    this.startGetGpsLocationWorker(selectedRoute.id)
  },

  onRouteSelected(e) {
    const selectedRouteIndex = e.currentTarget.dataset.index;
    this.routeSelect(selectedRouteIndex, 0);
  },

  onStationClicked(e) {
    const selectedStationIndex = e.currentTarget.dataset.index;

    const {
      selectedRoute
    } = this.data;
    const selectedStation = selectedRoute.stations[selectedStationIndex];
    const selectedStationLatitude = selectedStation.latitude;
    const selectedStationLongitude = selectedStation.longitude;
    this.setData({
      selectedStationIndex,
      scrollToStationId: '',
      selectedStationLatitude,
      selectedStationLongitude,
    });

    this.updateStationMarkers(false);
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    const { lastIntervalId } = this.data;
    if (lastIntervalId) {
      clearInterval(lastIntervalId);
    }
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})