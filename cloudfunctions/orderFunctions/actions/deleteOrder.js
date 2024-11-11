const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();
const COLLECTION_NAME_ORDERS = 'orders';

exports.main = async (props, context) => {
  const openid = cloud.getWXContext().OPENID;
  const { orderId } = props;

  try {
    const order = await db
      .collection(COLLECTION_NAME_ORDERS)
      .where({
        _id: orderId,
        userId: openid,
      })
      .get();

    if (!order.data.length) {
      return {
        success: false,
        message: 'Order not found or no permission to delete',
      };
    }

    const result = await db
      .collection(COLLECTION_NAME_ORDERS)
      .doc(orderId)
      .remove();

    return {
      success: true,
      message: 'Order deleted successfully',
      result,
    };
  } catch (error) {
    console.error('Failed to delete order:', error);
    return {
      success: false,
      message: 'Failed to delete order',
      error: error.message,
    };
  }
};
