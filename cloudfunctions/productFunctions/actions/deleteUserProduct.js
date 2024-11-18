const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;
const COLLECTION_NAME_FLEA_MARKET_PRODUCTS = 'flea-market-products';

exports.main = async (props, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { productId } = props;

  try {
    const productResult = await db
      .collection(COLLECTION_NAME_FLEA_MARKET_PRODUCTS)
      .where({
        _id: productId,
        userId: openid,
      })
      .get();

    if (!productResult.data.length) {
      return {
        success: false,
        message: 'Product not found or you do not have permission to delete it',
      };
    }

    const result = await db
      .collection(COLLECTION_NAME_FLEA_MARKET_PRODUCTS)
      .doc(productId)
      .remove();

    return {
      success: true,
      data: result,
      message: 'Item deleted successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: 'Failed to delete item',
    };
  }
};
