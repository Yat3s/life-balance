const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();

exports.main = async (data, context) => {
  const type = data.type;
  const filter = { };
  const openid = cloud.getWXContext().OPENID;
  const _ = db.command;

  if (type == 'published') {
    filter.published = true;
  } else if (type == 'personal') {
    const key = 'participants._openid'
    filter[key] = openid;
  }

  return (await db.collection('activities').where(filter).get()).data;
}