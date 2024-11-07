const db = wx.cloud.database();
const _ = db.command;

const COLLECTION_NAME_PRODUCTS = 'products';

export const fetchAllProducts = () => {
  return db.collection(COLLECTION_NAME_PRODUCTS).get();
};
