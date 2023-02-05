
const cloud = require('wx-server-sdk');
const rp = require('request-promise');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (data, context) => {
  var options = {
    uri: `https://parkinglotsendpoint.westus.inference.ml.azure.com/score`,
    headers: {
      'Authorization': 'Bearer 3zqD16aiaZNoohRjdSQKumLUe0LfZorX',
    },
    json: false,
  }

  const raw = await rp.get(options)
  const cleanedResult = raw.replace(/\\/g, "").slice(1, -1);

  const body = JSON.parse(cleanedResult);
  return {
    underground: body.ResultUnderground,
    ground: body.ResultGround
  };
}