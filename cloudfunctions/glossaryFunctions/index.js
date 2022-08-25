const queryGlossary = require('./actions/queryGlossary');
const proposeTerm = require('./actions/proposeTerm');
const admin = require('./actions/admin');

exports.main = async (event, context) => {
  switch (event.action) {
    case 'queryGlossary':
      const query = event.data;
      return await queryGlossary.main(query, context);
    case 'proposeTerm':
      const term = event.data.term;
      return await proposeTerm.main(term, context);
    case 'adminQuery':
      return await admin.query(context);
    case 'updateGlossary':
      const term_id = event.data.term_id;
      return await admin.main(term_id, context);
  }
}

