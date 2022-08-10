const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();
const DATABASE = 'glossaries'
const PROPOSE_DATABASE = 'propose-glossaries'
const _ = db.command

getItem = async (condition) => {
  const addItemNumber = await db.collection(PROPOSE_DATABASE).where(condition).count()
  const total = addItemNumber.total
  const batchTimes = Math.ceil(total / 100)
  const tasks = []
  for (let i = 0; i < batchTimes; ++i) {
    const promise = db.collection(PROPOSE_DATABASE).where(condition).skip(i * 100).limit(100).get()
    tasks.push(promise)
  }
  if (!tasks.length) {
    return null;
  }

  return (await Promise.all(tasks)).reduce((acc, cur) => {
    return { data: acc.data.concat(cur.data) }
  })
}

exports.main = async (term, context) => {
  const proposeCondition = {
    status: _.eq(true),
    glossary_id: _.eq('')
  }
  let addItem = await getItem(proposeCondition)
  if (addItem) {
    addItem = addItem.data
    for (let i = 0; i < addItem.length; ++i) {
      const tmpItem = addItem[i]
      await db.collection(DATABASE).add({
        data: {
          synonyms: tmpItem.synonyms,
          definition: tmpItem.definition,
          name: tmpItem.name,
          authors: tmpItem.authors,
        }
      })

      await db.collection(PROPOSE_DATABASE).where({
        _id: _.eq(tmpItem._id)
      }).remove()
    }
  }

  const editCondition = {
    status: _.eq(true),
    glossary_id: _.neq('')
  }
  let editItem = await getItem(editCondition)
  if (editItem) {
    editItem = editItem.data
    for (let i = 0; i < editItem.length; ++i) {
      const tmpItem = editItem[i]
      await db.collection(DATABASE).where({
        _id: _.eq(tmpItem.glossary_id)
      }).update({
        data: {
          definition: tmpItem.definition,
          synonyms: _.addToSet({
            $each: tmpItem.synonyms
          }),
          authors: _.addToSet({
            $each: tmpItem.authors
          })
        }
      })

      await db.collection(PROPOSE_DATABASE).where({
        _id: _.eq(tmpItem._id)
      }).remove()
    }
  }

  return await db.collection(PROPOSE_DATABASE).add({
    data: {
      glossary_id: term.id,
      synonyms: term.synonyms,
      definition: term.definition,
      name: term.name,
      authors: term.author,
      status: true
    }
  })
}