const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();
const COLLECTION_NAME_ORDERS = 'orders';

exports.main = async (props, context) => {
  const openid = cloud.getWXContext().OPENID;
  const { orderId, paid } = props;

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
        message: 'Order not found or no permission to update',
      };
    }

    const result = await db
      .collection(COLLECTION_NAME_ORDERS)
      .doc(orderId)
      .update({
        data: {
          paid,
          paidAt: Date.now(),
        },
      });

    return {
      success: true,
      message: 'Order payment status updated successfully',
      result,
    };
  } catch (error) {
    console.error('Failed to update order payment status:', error);
    return {
      success: false,
      message: 'Failed to update order payment status',
      error: error.message,
    };
  }
};
