const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();
const _ = db.command;
const DATABASE = 'glossaries';

exports.main = async (query, context) => {
  if (!Number.isInteger(query.pageSize) || !Number.isInteger(query.pageNumber) || query.pageSize <= 0 || query.pageNumber < 1) {
    const result = [];
    return result;
  }

  const skipItems = query.pageSize * (query.pageNumber - 1);
  if (!query.keyword) {
    const result = await db.collection(DATABASE)
      .skip(skipItems)
      .limit(query.pageSize)
      .get();
    return result.data;
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
    .skip(skipItems)
    .limit(query.pageSize)
    .field({
      _id: true,
      synonyms: true,
      name: true,
      definition: true
    }).get();
  return result.data;
}