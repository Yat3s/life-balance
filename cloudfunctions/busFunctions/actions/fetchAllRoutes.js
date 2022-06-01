const cloud = require('wx-server-sdk');
const rp = require('request-promise');
const DEVICE_ID = 'lifebalance'

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (data, context) => {
  let {
    siteId
  } = data;

  return await getAllRoutes(siteId);
}

async function getAllRoutes(siteId) {
  const st1 = Date.now();
  const [routeResData, allStationsMapData, routesToStationsData, allSchedulesMapData] = await Promise.allSettled([
    request(`http://easyconnectorwebservice.cloudapp.net:8080/ShuttleService.svc/routes/${siteId}`),
    getAllStationsMap(siteId),
    getRoutesToStations(siteId),
    getAllSchedulesMap(),
  ])

  const routeRes = routeResData.value;
  const allStationsMap = allStationsMapData.value;
  const routesToStations = routesToStationsData.value;
  const allSchedulesMap = allSchedulesMapData.value;
  console.log("Step 1:", Date.now() - st1);

  let result = []
  for (const item of routeRes) {
    if (item.Route.Deleted == true) {
      continue;
    }

    const route = item.Route;
    const routeId = route.Id;

    const stations = getStationsByRouteId(routeId, allStationsMap, routesToStations, allSchedulesMap);

    result.push({
      id: route.Id,
      duration: route.Duration,
      nameCh: route.Des_CH,
      nameEn: route.Des_EN,
      desc: route.Information,
      gpsTracking: route.GpsTracking,
      sequence: route.Sequence,
      stations,
    });
  }

  return result;
}

function getStationsByRouteId(routeId, allStationsMap, routesToStations, allSchedulesMap) {
  let stations = []
  for (const routeToStation of routesToStations) {
    if (routeToStation.RouteId === routeId) {
      const stationId = routeToStation.StationId
      let station = allStationsMap.get(stationId);
      if (station) {
        let schedules = allSchedulesMap.get(stationId);
        var schedulesFiltered = schedules.filter(function (value, index, arr) {
          return value.routeId === routeId;
        });
        station.position = routeToStation.Position;
        station.schedules = schedulesFiltered;
        stations.push(station);
      }
    }
  }

  stations.sort((a, b) => {
    return a.position - b.position;
  })


  return stations;
}

async function getAllSchedulesMap() {
  const allSchedulesRes = await request(`http://easyconnectorwebservice.cloudapp.net:8080/ShuttleService.svc/allschedules`);
  const allSchedulesMap = new Map();
  for (const schedule of allSchedulesRes) {
    const stationId = schedule.StationId;
    let scheduleList = allSchedulesMap.get(stationId);
    if (!scheduleList) {
      scheduleList = [];
    }
    scheduleList.push({
      stationId,
      routeId: schedule.RouteId,
      time: schedule.Time,
      heading: schedule.Updown,
    });

    allSchedulesMap.set(stationId, scheduleList);
  }
  return allSchedulesMap;
}

async function getRoutesToStations(siteId) {
  return await request(`http://easyconnectorwebservice.cloudapp.net:8080/ShuttleService.svc/getroutetostationsbysite/${siteId}`);
}

async function getAllStationsMap(siteId) {
  const allStationRes = await request(`http://easyconnectorwebservice.cloudapp.net:8080/ShuttleService.svc/getstations/${siteId}`);
  let stationsMap = new Map()

  for (const station of allStationRes) {
    const stationId = station.Id;
    stationsMap.set(stationId, {
      id: station.Id,
      nameCh: station.Des_CH,
      nameEn: station.Des_EN,
      latitude: station.Latitude,
      longitude: station.Longitude,
    })
  }

  return stationsMap;
}

async function request(uri) {
  var options = {
    uri,
    json: true,
    headers: {
      "deviceId": DEVICE_ID
    }
  }

  return await rp.get(options);
}