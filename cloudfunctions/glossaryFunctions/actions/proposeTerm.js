const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();
const DATABASE = 'glossaries'
const PROPOSE_DATABASE = 'propose-glossaries'
const _ = db.command

exports.main = async (term, context) => {
  // If term.id is null or undefined, it is to add a new term. Otherwise, edit a term.
  const isAdding = term.id === null || term.id === undefined
  if (isAdding) {
    await db.collection(DATABASE).add({
      data: {
        synonyms: term.synonyms,
        definition: term.definition,
        name: term.name,
        authors: term.author,
      }
    })
  } else {
    await db.collection(DATABASE).where({
      _id: term.id
    }).update({
      data: {
        definition: term.definition,
        synonyms: _.addToSet({
          $each: term.synonyms
        }),
        authors: _.addToSet({
          $each: term.author
        })
      }
    })
  }

  return await db.collection(PROPOSE_DATABASE).add({
    data: {
      glossaryId: term.id,
      synonyms: term.synonyms,
      definition: term.definition,
      name: term.name,
      authors: term.author,
      status: true
    }
  })
}