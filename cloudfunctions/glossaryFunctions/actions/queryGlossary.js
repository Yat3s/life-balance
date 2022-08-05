const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();
const DATABASE_NAME = 'glossaries'

exports.main = async (query, context) => {
  const _ = db.command

  if (!query) {
    const result = await db.collection(DATABASE_NAME).get()
    return result.data
  }
  else {
    const result = await db.collection(DATABASE_NAME).where(_.or([
      {
        synonyms: {
          $regex: '.*' + query,
          $options: 'i'
        }
      },
      {
        name: {
          $regex: '.*' + query,
          $options: 'i'
        }
      }
    ])).field({
      _id: true,
      synonyms: true,
      name: true,
      definition: true
    }).get()
    return result.data
  }
}