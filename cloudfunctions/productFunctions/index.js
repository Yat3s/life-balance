const createProduct = require('./actions/createProduct');
const fetchAllProducts = require('./actions/fetchAllProducts');
const fetchAllUserProducts = require('./actions/fetchAllUserProducts');
const updateProduct = require('./actions/updateProduct');

exports.main = async (event, context) => {
  const props = event.data;

  switch (event.action) {
    case 'createProduct':
      return await createProduct.main(props, context);
    case 'fetchAllProducts':
      return await fetchAllProducts.main(props, context);
    case 'fetchAllUserProducts':
      return await fetchAllUserProducts.main(props, context);
    case 'updateProduct':
      return await updateProduct.main(props, context);
    default:
      return {
        success: false,
        message: 'Invalid action',
      };
  }
};
