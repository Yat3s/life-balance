const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();
const DATABASE_NAME = 'glossaries'
const _ = db.command

exports.main = async (term, context) => {
  let queryRes = []
  let returnInfo = []
  await db.collection(DATABASE_NAME).limit(1).where({
    name: {
      $regex: '^' + term.name + '$',
      $options: 'i'
    }
  }).get().then(res => {
    queryRes = res.data
  })

  if (queryRes.length) {
    returnInfo = {
      code: 400,
      message: "Have existed, propose unsuccessfully!"
    }
    return returnInfo;
  }

  try {
    await db.collection(DATABASE_NAME).add({
      data: {
        synonyms: term.synonyms,
        definition: term.definition,
        name: term.name,
        authors: term.author,
        status: true
      }
    })
  } catch (e) {
    returnInfo = {
      code: 500,
      message: "Sever error, propose unsuccessfully!"
    }
    return returnInfo;
  }

  returnInfo = {
    code: 201,
    message: "Propose successfully!"
  }
  return returnInfo;
}