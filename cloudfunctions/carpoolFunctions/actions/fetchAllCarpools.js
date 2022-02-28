const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();

exports.main = async (data, context) => {
  return (await db.collection('carpools').orderBy('startDate', 'desc').get()).data;
}