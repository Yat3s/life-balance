const fetchAllCarpools = require('./actions/fetchAllCarpools');
const fetchAllPersonalCarpools = require('./actions/fetchAllPersonalCarpools');

const joinCarpool = require('./actions/joinCarpool')

exports.main = async (event, context) => {
  const data = event.data;
  switch (event.action) {
    case 'fetchAllCarpools':
      return await fetchAllCarpools.main(data, context);
    case 'fetchAllPersonalCarpools':
      return await fetchAllPersonalCarpools.main(data, context);
    case 'joinCarpool':
      return await joinCarpool.main(data, context);
  }
}