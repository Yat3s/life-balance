// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const id = event.id;
  const phoneNumber = event.phoneNumberData.data.phoneNumber;

  console.log(phoneNumber);

  return (await db.collection('users').doc(id).update({
    data: {
      phoneNumber
    }
  }));
}