const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();

exports.main = async (data, context) => {
  const id = data.id;
  const phoneNumber = data.phoneNumber;

  console.log(phoneNumber);

  return (await db.collection('users').doc(id).update({
    data: {
      phoneNumber 
    }
  }));
}