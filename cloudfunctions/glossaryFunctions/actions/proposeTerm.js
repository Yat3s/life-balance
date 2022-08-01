const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();
const databaseName = 'glossaries'

exports.main = async (term, context) => {

  await db.collection(databaseName).add({
    data: {
      synonyms: term.synonyms,
      description: term.description,
      fullname: term.fullname,
      authors: term.authors,
      status: true
    }
  })

  return true;
}