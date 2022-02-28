const cloud = require('wx-server-sdk');
const COLLECTION_NAME = "weworkparking";

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();

exports.main = async (data, context) => {

  const _ = db.command;
  let bookings = (await db.collection(COLLECTION_NAME).orderBy('_createTime', 'desc').get()).data;
  const theLatestBooking = bookings[0];

  // If booking form is expired, create a new one
  console.log("remote", new Date(theLatestBooking._createTime).toDateString());
  console.log("local", new Date().toDateString());
  if (new Date(theLatestBooking._createTime).toDateString() != new Date().toDateString()) {
    const parkingDate = new Date();
    parkingDate.setDate(parkingDate.getDate() + 1);

    await db.collection(COLLECTION_NAME).add({
      data: {
        _createTime: Date.now(),
        participants: [],
        parkingDate: parkingDate.toISOString().substring(0, 10)
      }
    });
    bookings = (await db.collection(COLLECTION_NAME).orderBy('_createTime', 'desc').get()).data;
  }

  return [bookings[0], bookings[1]];
}