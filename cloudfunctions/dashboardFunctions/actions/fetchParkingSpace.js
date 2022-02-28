const cloud = require('wx-server-sdk');
const rp = require('request-promise');
const AREA_GROUND = 15;
const AREA_UNDERGROUND = 12;

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();

exports.main = async (data, context) => {

  var options = {
    uri: `http://ms.suzhouparking.kingfaster.com.cn/ParkingSpaceApi/GetData`,
    json: true
  }
  const body = await rp.get(options);
  const { msparkingData } = body;
  let ground = 0;
  let underground = 0;

  for (const area of msparkingData) {
    if (area.areaCode == AREA_UNDERGROUND) {
      underground = area.areaFreeSpaceNum;
    }

    if (area.areaCode == AREA_GROUND) {
      ground = area.areaFreeSpaceNum;
    }
  }

  return {
    ground, underground
  }
}