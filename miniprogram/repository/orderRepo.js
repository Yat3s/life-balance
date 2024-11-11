import { cloudCall, cloudFunctionCall } from './baseRepo';

const CLOUD_FUNCTION_COLLECTION = 'orderFunctions';

export function createOrder(productId) {
  return cloudFunctionCall(CLOUD_FUNCTION_COLLECTION, 'createOrder', {
    productId,
  });
}

export function updateOrder(orderId, paid) {
  return cloudCall(
    db.doc(orderId).update({ data: { paid, paidAt: Date.now() } }),
    'updateOrder'
  );
}

export const deleteOrder = (orderId) => {
  return cloudFunctionCall(CLOUD_FUNCTION_COLLECTION, 'deleteOrder', {
    orderId,
  });
};
