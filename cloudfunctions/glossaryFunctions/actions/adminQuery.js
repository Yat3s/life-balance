const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();
const _ = db.command;
const PROPOSE_DATABASE = 'propose-glossaries';

// To query the proposed term need to approve
exports.main = async (event) => {
  const result = await db.collection(PROPOSE_DATABASE)
    .where({
      status: false
    }).get();
  return result.data;
}