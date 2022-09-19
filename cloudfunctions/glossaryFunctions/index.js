const queryGlossary = require('./actions/queryGlossary');
const proposeTerm = require('./actions/proposeTerm');
const adminQuery = require('./actions/adminQuery');
const adminUpdate = require('./actions/adminUpdate');

exports.main = async (event, context) => {
  switch (event.action) {
    case 'queryGlossary':
      const query = event.data;
      return await queryGlossary.main(query, context);
    case 'proposeTerm':
      const term = event.data.term;
      return await proposeTerm.main(term, context);
    case 'adminQuery':
      return await adminQuery.main(context);
    case 'adminUpdate':
      const term_id = event.data.term_id;
      return await adminUpdate.main(term_id, context);
  }
}

