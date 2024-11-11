import { cloudCall, cloudFunctionCall } from './baseRepo';

const COLLECT_NAME_ORDERS = 'orders';
const CLOUD_FUNCTION_COLLECTION = 'orderFunctions';
const db = wx.cloud.database().collection(COLLECT_NAME_ORDERS);

export const createOrder = (productId) => {
  return cloudFunctionCall(CLOUD_FUNCTION_COLLECTION, 'createOrder', {
    productId,
  });
};

export const updateOrder = (orderId, paid) => {
  return cloudCall(
    db.doc(orderId).update({ data: { paid, paidAt: Date.now() } }),
    'updateOrder'
  );
};

export const deleteOrder = (orderId) => {
  return cloudFunctionCall(CLOUD_FUNCTION_COLLECTION, 'deleteOrder', {
    orderId,
  });
};
