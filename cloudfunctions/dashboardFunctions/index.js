const fetchParkingSpace = require('./actions/fetchParkingSpace')
const fetchStockData = require('./actions/fetchStockData')
const fetchWechatGroups = require('./actions/fetchWechatGroups')
const fetchFaq = require('./actions/fetchFaq')
const faqPv = require('./actions/faqPv')
const fetchWeworkParkingBooking = require('./actions/fetchWeworkParkingBooking')
const signupWeworkParkingBooking = require('./actions/signupWeworkParkingBooking')
const cancelWeworkParkingBooking = require('./actions/cancelWeworkParkingBooking')

exports.main = async (event, context) => {
  const data = event.data;
  switch (event.action) {
    case 'fetchParkingSpace':
      return await fetchParkingSpace.main(data, context);
    case 'fetchStockData':
      return await fetchStockData.main(data, context);
    case 'fetchWechatGroups':
      return await fetchWechatGroups.main(data, context);
    case 'fetchFaq':
      return await fetchFaq.main(data, context);
    case 'faqPv':
      return await faqPv.main(data, context);
    case 'fetchWeworkParkingBooking':
      return await fetchWeworkParkingBooking.main(data, context);
    case 'signupWeworkParkingBooking':
      return await signupWeworkParkingBooking.main(data, context);
    case 'cancelWeworkParkingBooking':
      return await cancelWeworkParkingBooking.main(data, context);
  }
}