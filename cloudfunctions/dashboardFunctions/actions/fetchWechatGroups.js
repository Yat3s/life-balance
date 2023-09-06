
// const cloud = require('wx-server-sdk');
// const COLLECTION_NAME_WECHAT_GROUPS = "wechatgroups";

// cloud.init({
//   env: cloud.DYNAMIC_CURRENT_ENV
// });
// const db = cloud.database();

// exports.main = async (data, context) => {
//   const circles = (await db.collection(COLLECTION_NAME_WECHAT_GROUPS).orderBy('_createTime', 'desc').get()).data;

//   for (const circle of circles) {
//     if (circle.participants) {
//       circle.participants = circle.participants.slice(0, 10);
//     }
//   }
//   return circles;
// }


const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});
const MAX_LIMIT = 100;
const db = cloud.database();
const COLLECTION_NAME = "wechatgroups";

exports.main = async (data, context) => {
  const countResult = await db.collection(COLLECTION_NAME).count();
  const total = countResult.total;
  const batchTimes = Math.ceil(total / 100);
  const tasks = [];
  for (let i = 0; i < batchTimes; i++) {
    const promise = db
      .collection(COLLECTION_NAME)
      .skip(i * MAX_LIMIT)
      .limit(MAX_LIMIT)
      .get();
    tasks.push(promise);
  }
  const allResult = await Promise.all(tasks);
  let list = []
  allResult.forEach(result => {
    list = list.concat(result.data);
  })

  for (const circle of list) {
    if (circle.participants) {
      circle.participants = circle.participants.slice(0, 10);
    }
  }
  return list;
};