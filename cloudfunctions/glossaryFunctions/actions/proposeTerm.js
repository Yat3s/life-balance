const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();
const DATABASE_NAME = 'glossaries'
const _ = db.command

exports.main = async (term, context) => {
  let queryRes = []
  await db.collection(DATABASE_NAME).where({
    name: _.eq(term.name)
  }).get().then(res => {
    queryRes = res.data
  })
  if (queryRes.length != 0) {
    return "Propose failed, have existed!";
  } else {
    await db.collection(DATABASE_NAME).add({
      data: {
        synonyms: term.synonyms,
        definition: term.definition,
        name: term.name,
        authors: term.author,
        status: true
      }
    })
    return "Propose successfully!";
  }
}