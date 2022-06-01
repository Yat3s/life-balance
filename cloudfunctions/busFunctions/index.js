const fetchAllRoutes = require('./actions/fetchAllRoutes');
const fetchGpsLocation = require('./actions/fetchGpsLocation');

exports.main = async (event, context) => {
  const data = event.data;
  switch (event.action) {
    case 'fetchAllRoutes':
      return await fetchAllRoutes.main(data, context);
      case 'fetchGpsLocation':
      return await fetchGpsLocation.main(data, context);
  }
}