
const cloud = require('wx-server-sdk');
const COLLECTION_NAME = "faq";

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();

exports.main = async (data, context) => {

  const id = data.id;
  const _ = db.command;
  return (await db.collection(COLLECTION_NAME).doc(id).update({
    data: {
      pv: _.inc(1)
    }
  })).data;
}