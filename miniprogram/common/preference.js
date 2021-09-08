const PREFERENCE_CITY = "PERF.city";
const PREFERENCE_LATITUDE = "PERF.latitude";
const PREFERENCE_LONGITUDE = "PERF.longitude";

function getCity() {
  return wx.getStorageSync(PREFERENCE_CITY);
}

function setCity(city) {
  wx.setStorage({
    key: PREFERENCE_CITY,
    data: city
  });
}

function getLatitude() {
  return wx.getStorageSync(PREFERENCE_LATITUDE);
}

function getLongitude() {
  return wx.getStorageSync(PREFERENCE_LONGITUDE);
}

function setLocation(latitude, longitude) {
  wx.setStorage({
    key: PREFERENCE_LATITUDE,
    data: latitude
  });

  wx.setStorage({
    key: PREFERENCE_LONGITUDE,
    data: longitude
  });
}

module.exports = {
  getCity,
  setCity,
  getLongitude,
  getLatitude,
  setLocation
}