const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();
const DATABASE = 'glossaries'

exports.main = async (query, context) => {
  const _ = db.command

  if (!query.keyword) {
    const result = await db.collection(DATABASE)
      .skip(query.pageSize * (query.pageNumber - 1))
      .limit(query.pageSize)
      .get()
    return result.data
  }

  const result = await db.collection(DATABASE)
    .where(_.or([
      {
        synonyms: {
          $regex: query.keyword,
          $options: 'i'
        }
      },
      {
        name: {
          $regex: query.keyword,
          $options: 'i'
        }
      }
    ]))
    .skip(query.pageSize * (query.pageNumber - 1))
    .limit(query.pageSize)
    .field({
      _id: true,
      synonyms: true,
      name: true,
      definition: true
    }).get()
  return result.data
}