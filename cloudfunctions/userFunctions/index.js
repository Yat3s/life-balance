const updatePhoneNumber = require('./actions/updatePhoneNumber')

exports.main = async (event, context) => {
  const data = event.data;
  switch (event.action) {
    case 'updatePhoneNumber':
      return await updatePhoneNumber.main(data, context);
  }
}