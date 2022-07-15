const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();
const CONFIG_ID = "9e7190f1617386da018b7e187747d1b3"

exports.main = async (data, context) => {
  const _ = db.command;
  
  return (await db.collection('appconfig').doc(CONFIG_ID).update({
    data: {
      msftBoostCount: _.inc(1),
    }
  })).data;
}