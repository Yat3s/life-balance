const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();
const databaseName = 'glossaries'

exports.main = async (query, context) => {
  const _ = db.command

  if (!query) {
    const result = await db.collection(databaseName).get()
    return result.data
  }
  else {
    const result = await db.collection(databaseName).where(_.or([
      {
        synonyms: {
          $regex: '.*' + query,
          $options: 'i'
        }
      },
      {
        fullname: {
          $regex: '.*' + query,
          $options: 'i'
        }
      }
    ])).field({
      _id: true,
      synonyms: true,
      fullname: true,
      description: true
    }).get()
    return result.data
  }
}