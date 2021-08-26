const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();

exports.main = async (data, context) => {
  const _ = db.command;
  const filter = {
    _id: _.in(data.ids)
  };

  return (await db.collection('activities').where(filter).get()).data;
}