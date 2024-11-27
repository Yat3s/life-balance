const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const COLLECTION_NAME_WECHAT_GROUPS = 'wechatgroups';

exports.main = async (data, context) => {
  const filter = {};
  const userId = data.id;
  const _ = db.command;
  filter['participants._id'] = userId;

  return (
    await db
      .collection(COLLECTION_NAME_WECHAT_GROUPS)
      .where(filter)
      .orderBy('_createTime', 'desc')
      .get()
  ).data;
};
