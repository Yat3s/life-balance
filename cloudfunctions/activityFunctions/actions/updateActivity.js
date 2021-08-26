const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();

exports.main = async (data, context) => {
  const id = data.id;
  const activityBody = data.activityBody;
  return (await db.collection('activities').doc(id).update({
    data: activityBody
  })).data;
}