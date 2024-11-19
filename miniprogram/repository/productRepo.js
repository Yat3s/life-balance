import { cloudFunctionCall } from './baseRepo';

const COLLECTION_NAME_PRODUCTS = 'products';
const COLLECTION_NAME_FLEA_MARKET_PRODUCTS = 'flea-market-products';
const CLOUD_FUNCTION_COLLECTION = 'productFunctions';
const db = wx.cloud.database();

export const fetchProduct = (productId) => {
  return db
    .collection(COLLECTION_NAME_PRODUCTS)
    .where({
      _id: productId,
    })
    .get();
};

export const fetchFleaMarketProduct = (productId) => {
  return db
    .collection(COLLECTION_NAME_FLEA_MARKET_PRODUCTS)
    .where({
      _id: productId,
    })
    .get();
};

export const createUserProduct = (createUserProductData) => {
  return cloudFunctionCall(CLOUD_FUNCTION_COLLECTION, 'createUserProduct', {
    createUserProductData,
  });
};

export const deleteUserProduct = (productId) => {
  return cloudFunctionCall(CLOUD_FUNCTION_COLLECTION, 'deleteUserProduct', {
    productId,
  });
};

export const updateUserProduct = (productId, updateUserProductData) => {
  return cloudFunctionCall(CLOUD_FUNCTION_COLLECTION, 'updateUserProduct', {
    productId,
    updateUserProductData,
  });
};

export const updateWantedBy = (productId) => {
  return cloudFunctionCall(CLOUD_FUNCTION_COLLECTION, 'updateWantedBy', {
    productId,
  });
};

export const fetchAllProducts = () => {
  return cloudFunctionCall(CLOUD_FUNCTION_COLLECTION, 'fetchAllProducts', {});
};

export const fetchAllFleaMarketProducts = () => {
  return cloudFunctionCall(
    CLOUD_FUNCTION_COLLECTION,
    'fetchAllFleaMarketProducts',
    {}
  );
};

export const fetchAllUserProducts = () => {
  return cloudFunctionCall(
    CLOUD_FUNCTION_COLLECTION,
    'fetchAllUserProducts',
    {}
  );
};
