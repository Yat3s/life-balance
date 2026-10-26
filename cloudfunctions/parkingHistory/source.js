const { getJson } = require('./http-json');

const ENDPOINT = 'http://ms.suzhouparking.kingfaster.com.cn/ParkingSpaceApi/GetData';

function parseSpaces(body) {
  if (!body || !Array.isArray(body.msparkingData)) {
    throw new Error('Parking source has no msparkingData array');
  }
  const result = {};
  for (const [name, code] of [['b25', 12], ['zhongmeng', 2]]) {
    const areas = body.msparkingData.filter(area => Number(area.areaCode) === code);
    if (areas.length !== 1) throw new Error(`Parking source missing or duplicate area ${code}`);
    const raw = areas[0].areaFreeSpaceNum;
    const value = typeof raw === 'string' && /^\d+$/.test(raw) ? Number(raw) : raw;
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new Error(`Invalid parking count for ${name}`);
    }
    result[name] = value;
  }
  return result;
}

async function fetchSpaces() {
  return parseSpaces(await getJson(ENDPOINT));
}

module.exports = { fetchSpaces, parseSpaces };
