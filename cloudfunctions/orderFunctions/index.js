const createOrder = require('./actions/createOrder');
const deleteOrder = require('./actions/deleteOrder');
const updateOrder = require('./actions/updateOrder');
const fetchAllUserOrders = require('./actions/fetchAllUserOrders');

exports.main = async (event, context) => {
  const props = event.data;

  switch (event.action) {
    case 'createOrder':
      return await createOrder.main(props, context);
    case 'deleteOrder':
      return await deleteOrder.main(props, context);
    case 'updateOrder':
      return await updateOrder.main(props, context);
    case 'fetchAllUserOrders':
      return await fetchAllUserOrders.main(props, context);
    default:
      return {
        success: false,
        message: 'Invalid action',
      };
  }
};
