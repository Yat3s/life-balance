const cloud = require('wx-server-sdk');
const rp = require('request-promise');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();

exports.main = async (data, context) => {

  var options = {
    uri: `https://canteentraffic.azurewebsites.net/CanteenTrafficPredict/GetPredict`,
    json: true
  }
  const body = await rp.get(options);
  const { color, waitTime } = body;
  return {
    status: color,
    waitTime,
  }
}