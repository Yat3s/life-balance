const cloud = require('wx-server-sdk');
const rp = require('request-promise');
const DEVICE_ID = 'lifebalance'

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (data, context) => {
  let {
    routeId
  } = data;

  try {
    const res = await request(`https://ec-gps.cloudapp.net/odata/GetLatestLocationByRouteId(RouteId=${routeId})`);
    console.log(res);
    if (res.value && res.value[0]) {
      const gpsData = res.value[0];
      const longitudeNema = parseFloat(gpsData.Longitude) / 100
      const latitudeNema = parseFloat(gpsData.Latitude) / 100

      const longitude = Math.floor(longitudeNema) + (longitudeNema - Math.floor(longitudeNema)) / 0.6
      const latitude = Math.floor(latitudeNema) + (latitudeNema - Math.floor(latitudeNema)) / 0.6

      const gcj02 = wgs84togcj02(longitude, latitude)

      return {
        data: {
          plateNum: gpsData.PlateNum,
          longitude: gcj02[0],
          latitude: gcj02[1],
        }
      }
    } else {
      return {
        error: "Unavailable"
      };
    }
  } catch (error) {
    console.log(error);
    return {
      error: "Unavailable"
    };
  }
}

async function request(uri) {
  var options = {
    uri,
    json: true,
    headers: {
      "deviceId": DEVICE_ID
    }
  }

  return await rp(options);
}

const PI = 3.1415926535897932384626;
const a = 6378245.0;
const ee = 0.00669342162296594323;

function transformlat(lng, lat) {
  var lat = +lat;
  var lng = +lng;
  var ret = -100.0 + 2.0 * lng + 3.0 * lat + 0.2 * lat * lat + 0.1 * lng * lat + 0.2 * Math.sqrt(Math.abs(lng));
  ret += (20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0 / 3.0;
  ret += (20.0 * Math.sin(lat * PI) + 40.0 * Math.sin(lat / 3.0 * PI)) * 2.0 / 3.0;
  ret += (160.0 * Math.sin(lat / 12.0 * PI) + 320 * Math.sin(lat * PI / 30.0)) * 2.0 / 3.0;
  return ret
};

function transformlng(lng, lat) {
  var lat = +lat;
  var lng = +lng;
  var ret = 300.0 + lng + 2.0 * lat + 0.1 * lng * lng + 0.1 * lng * lat + 0.1 * Math.sqrt(Math.abs(lng));
  ret += (20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0 / 3.0;
  ret += (20.0 * Math.sin(lng * PI) + 40.0 * Math.sin(lng / 3.0 * PI)) * 2.0 / 3.0;
  ret += (150.0 * Math.sin(lng / 12.0 * PI) + 300.0 * Math.sin(lng / 30.0 * PI)) * 2.0 / 3.0;
  return ret
};

function out_of_china(lng, lat) {
  var lat = +lat;
  var lng = +lng;
  return !(lng > 73.66 && lng < 135.05 && lat > 3.86 && lat < 53.55);
};

function wgs84togcj02(lng, lat) {
  var lat = +lat;
  var lng = +lng;
  if (out_of_china(lng, lat)) {
    return [lng, lat]
  } else {
    var dlat = transformlat(lng - 105.0, lat - 35.0);
    var dlng = transformlng(lng - 105.0, lat - 35.0);
    var radlat = lat / 180.0 * PI;
    var magic = Math.sin(radlat);
    magic = 1 - ee * magic * magic;
    var sqrtmagic = Math.sqrt(magic);
    dlat = (dlat * 180.0) / ((a * (1 - ee)) / (magic * sqrtmagic) * PI);
    dlng = (dlng * 180.0) / (a / sqrtmagic * Math.cos(radlat) * PI);
    var mglat = lat + dlat;
    var mglng = lng + dlng;
    return [mglng, mglat]
  }
};