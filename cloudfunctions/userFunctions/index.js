const updatePhoneNumber = require('./actions/updatePhoneNumber');
const fetchUserProfile = require('./actions/fetchUserProfile');

exports.main = async (event, context) => {
  const data = event.data;
  switch (event.action) {
    case 'updatePhoneNumber':
      return await updatePhoneNumber.main(data, context);
    case 'fetchUserProfile':
      return await fetchUserProfile.main(data, context);
  }
}