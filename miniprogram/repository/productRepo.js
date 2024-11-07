import { cloudFunctionCall } from './baseRepo';

const db = wx.cloud.database();
const _ = db.command;
const COLLECTION_NAME_PRODUCTS = 'products';
const CLOUD_FUNCTION_COLLECTION = 'productFunctions';

export const fetchAllProducts = () => {
  return db.collection(COLLECTION_NAME_PRODUCTS).get();
};

export const createItem = (createItemData) => {
  return cloudFunctionCall(CLOUD_FUNCTION_COLLECTION, 'createItem', {
    createItemData,
  });
};
