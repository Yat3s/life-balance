const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();

exports.main = async (data, context) => {
  const filter = { };
  const userId = data.id;
  const _ = db.command;
  filter['participants._id'] = userId;

  return (await db.collection('activities').where(filter).orderBy('_createTime', 'desc').get()).data;
}