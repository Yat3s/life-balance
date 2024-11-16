const createUserProduct = require('./actions/createUserProduct');
const fetchAllFleaMarketProducts = require('./actions/fetchAllFleaMarketProducts');
const fetchAllProducts = require('./actions/fetchAllProducts');
const fetchAllUserProducts = require('./actions/fetchAllUserProducts');
const updateUserProduct = require('./actions/updateUserProduct');
const updateInterestedUsers = require('./actions/updateInterestedUsers');

exports.main = async (event, context) => {
  const props = event.data;

  switch (event.action) {
    case 'createUserProduct':
      return await createUserProduct.main(props, context);
    case 'fetchAllFleaMarketProducts':
      return await fetchAllFleaMarketProducts.main(props, context);
    case 'fetchAllProducts':
      return await fetchAllProducts.main(props, context);
    case 'fetchAllUserProducts':
      return await fetchAllUserProducts.main(props, context);
    case 'updateUserProduct':
      return await updateUserProduct.main(props, context);
    case 'updateInterestedUsers':
      return await updateInterestedUsers.main(props, context);
    default:
      return {
        success: false,
        message: 'Invalid action',
      };
  }
};
