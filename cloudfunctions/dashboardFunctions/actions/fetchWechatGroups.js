
const cloud = require('wx-server-sdk');
const COLLECTION_NAME_WECHAT_GROUPS = "wechatgroups";

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();

exports.main = async (data, context) => {
  return (await db.collection(COLLECTION_NAME_WECHAT_GROUPS).orderBy('code', 'asc').get()).data;
}