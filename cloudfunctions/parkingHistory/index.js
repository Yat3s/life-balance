const cloud = require('wx-server-sdk');
const config = require('./config');
const { fetchSpaces } = require('./source');
const { createHandler } = require('./history');
const { createWorkdayResolver } = require('./workdays');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const isWorkday = createWorkdayResolver({ db, settings: config.calendar });
const handle = createHandler({ db, config, fetchSpaces, isWorkday });

exports.main = async event => {
  try {
    return await handle(event, cloud.getWXContext());
  } catch (error) {
    console.error('parkingHistory failed', error);
    throw error;
  }
};
