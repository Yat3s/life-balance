const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();
const _ = db.command;
const DATABASE = 'glossaries';
const PROPOSE_DATABASE = 'propose-glossaries';

// After approve, update the glossary database
exports.main = async (term_id, context) => {
  // When term_id is undefine or null, return term
  if (!term_id && term_id !== 0) {
    return {
      code: 400,
      message: "Term_id type is not right",
      error: "Term_id error"
    }
  }
  let term = [];
  try {
    // To support multi-administors, through transaction to avoid repeat operation
    await db.runTransaction(async transaction => {
      term = await transaction.collection(PROPOSE_DATABASE).doc(term_id).get();
      if (term.data && !term.data.status) {
        await transaction.collection(PROPOSE_DATABASE).doc(term_id).update({
          data: {
            status: true
          }
        });

        // if glossary_id is '', the term is needed to add to the database, else it is to update
        if (term.data.glossaryId === '') {
          await transaction.collection(DATABASE).add({
            data: {
              synonyms: term.data.synonyms,
              definition: term.data.definition,
              name: term.data.name,
              authors: term.data.authors,
            }
          });
        } else {
          await transaction.collection(DATABASE).where({
            _id: term.data.glossaryId
          }).update({
            data: {
              definition: term.data.definition,
              synonyms: _.addToSet({
                $each: term.data.synonyms
              }),
              authors: _.addToSet({
                $each: term.data.author
              })
            }
          })
        }
      } else {
        // If not excute the complete operation, rollback
        await transaction.rollback("Transaction error during add")
      }
    })

    return {
      code: 200,
      message: "Add successfully"
    }
  } catch (e) {
    let info = [];
    let errcode = 400;
    if (term.length === 0) {
      errcode = 401;
      info = "Current term has not exsited";
    } else if (term.data.status) {
      errcode = 402;
      info = "The term has been added by other administors";
    }

    return {
      code: errcode,
      message: info,
      error: e
    }
  }
}
