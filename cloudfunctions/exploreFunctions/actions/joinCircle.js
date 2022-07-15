const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();

exports.main = async (data, context) => {
  const id = data.id;
  const user = data.user;
  const _ = db.command;
  
  return (await db.collection('wechatgroups').doc(id).update({
    data: {
      participants: _.push(user),
      memberCount: _.inc(1),
    }
  })).data;
}