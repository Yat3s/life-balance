const queryGlossary = require('./actions/queryGlossary');
const proposeTerm = require('./actions/proposeTerm');

exports.main = async (event, context) => {
  switch (event.action) {
    case 'queryGlossary':
      const query = event.data.query;
      return await queryGlossary.main(query, context);
    case 'proposeTerm':
      const term = event.data.term;
      return await proposeTerm.main(term, context);
  }
}

