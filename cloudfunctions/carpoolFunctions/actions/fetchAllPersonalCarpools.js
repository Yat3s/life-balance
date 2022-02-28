const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();

exports.main = async (data, context) => {
  const filter = { };
  const openid = cloud.getWXContext().OPENID;
  const _ = db.command;
  const key = 'participants._openid'
  filter[key] = openid;

  return (await db.collection('carpools').where(filter).orderBy('startDate', 'desc').get()).data;
}