const queryGlossary = require('./actions/queryGlossary');

exports.main = async (event, context) => {
  const query = event.data.query;
  switch (event.action) {
    case 'queryGlossary':
      return await queryGlossary.main(query, context);
  }
}


const eve = {
  data: {
    query: "om"
  },
  action: "queryGlossary"
}
const res = this.main(eve, "")
res.then(e => console.log(e))