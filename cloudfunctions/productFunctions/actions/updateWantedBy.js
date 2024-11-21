const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;
const COLLECTION_NAME_FLEA_MARKET_PRODUCTS = 'flea-market-products';

exports.main = async (props, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { productId } = props;

  if (!productId) {
    return {
      success: false,
      message: 'Product ID is required',
    };
  }

  try {
    const product = await db
      .collection(COLLECTION_NAME_FLEA_MARKET_PRODUCTS)
      .doc(productId)
      .get();

    if (!product.data) {
      return {
        success: false,
        message: 'Product not found',
      };
    }

    // Check if the current user is the owner
    if (product.data.userId === openid) {
      return;
    }

    // If not the owner, proceed with adding to wantedBy
    await db
      .collection(COLLECTION_NAME_FLEA_MARKET_PRODUCTS)
      .doc(productId)
      .update({
        data: {
          wantedBy: _.addToSet(openid),
        },
      });

    return {
      success: true,
      message: 'Successfully added to interested users',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: 'Failed to update interested users',
    };
  }
};
