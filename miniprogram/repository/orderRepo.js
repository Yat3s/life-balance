import { cloudFunctionCall } from './baseRepo';

const COLLECTION_NAME_ORDERS = 'orders';
const CLOUD_FUNCTION_COLLECTION = 'orderFunctions';
const db = wx.cloud.database().collection(COLLECTION_NAME_ORDERS);

export const fetchOrder = (orderId) => {
  return db
    .where({
      _id: orderId,
    })
    .get();
};

export const createOrder = (productId, createOrderData) => {
  return cloudFunctionCall(CLOUD_FUNCTION_COLLECTION, 'createOrder', {
    productId,
    createOrderData,
  });
};

export const updateOrder = (orderId, updateOrderData) => {
  return cloudFunctionCall(CLOUD_FUNCTION_COLLECTION, 'updateOrder', {
    orderId,
    updateOrderData,
  });
};

export const deleteOrder = (orderId) => {
  return cloudFunctionCall(CLOUD_FUNCTION_COLLECTION, 'deleteOrder', {
    orderId,
  });
};

export const fetchAllUserOrders = () => {
  return cloudFunctionCall(CLOUD_FUNCTION_COLLECTION, 'fetchAllUserOrders', {});
};
