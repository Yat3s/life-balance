
const cloud = require('wx-server-sdk');
const COLLECTION_NAME = "parking-full";

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();

exports.main = async (data, context) => {

  const id = data.id;
  const updateData = data.data
  return (await db.collection(COLLECTION_NAME).doc(id).update({
    data: updateData
  }));
}