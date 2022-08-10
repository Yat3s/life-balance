const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();
const DATABASE = 'glossaries'

exports.main = async (query, context) => {
  const _ = db.command

  if (!query) {
    const result = await db.collection(DATABASE).get()
    return result.data
  }

  const result = await db.collection(DATABASE).where(_.or([
    {
      synonyms: {
        $regex: query,
        $options: 'i'
      }
    },
    {
      name: {
        $regex: query,
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