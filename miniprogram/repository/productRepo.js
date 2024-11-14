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

export const createProduct = (createProductData) => {
  return cloudFunctionCall(CLOUD_FUNCTION_COLLECTION, 'createProduct', {
    createProductData,
  });
};

export const updateProduct = (productId, updateProductData) => {
  return cloudFunctionCall(CLOUD_FUNCTION_COLLECTION, 'updateProduct', {
    productId,
    updateProductData,
  });
};

export const fetchAllProducts = () => {
  return cloudFunctionCall(CLOUD_FUNCTION_COLLECTION, 'fetchAllProducts', {});
};

export const fetchAllUserProducts = () => {
  return cloudFunctionCall(
    CLOUD_FUNCTION_COLLECTION,
    'fetchAllUserProducts',
    {}
  );
};
