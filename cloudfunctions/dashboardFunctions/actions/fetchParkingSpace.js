const cloud = require('wx-server-sdk');
const rp = require('request-promise');
const AREA_ZHONGMENG = 2;
const AREA_B25 = 12;

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
exports.main = async (data, context) => {
  var options = {
    uri: `http://ms.suzhouparking.kingfaster.com.cn/ParkingSpaceApi/GetData`,
    json: true
  }
  const body = await rp.get(options);
  const { msparkingData } = body;
  let underground = 0;
  let b25 = 0;
  let zhongmeng = 0;

  for (const area of msparkingData) {
    if (area.areaCode == AREA_B25) {
      underground = area.areaFreeSpaceNum;
      b25 = area.areaFreeSpaceNum
    }

    if (area.areaCode == AREA_ZHONGMENG) {
      zhongmeng = area.areaFreeSpaceNum;
    }
  }

  return {
    b25, zhongmeng, underground
  }
}