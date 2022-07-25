const queryGlossary = require('./actions/queryGlossary');

exports.main = async (event, context) => {
  const query = event.data.query;
  switch (event.action) {
    case 'queryGlossary':
      return await queryGlossary.main(query, context);
  }
}
