const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;
const COLLECTION_NAME_FLEA_MARKET_PRODUCTS = 'flea-market-products';

exports.main = async (props, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { productId, updateProductData } = props;

  if (!productId) {
    return {
      success: false,
      message: 'Product ID is required',
    };
  }

  if (!updateProductData || Object.keys(updateProductData).length === 0) {
    return {
      success: false,
      message: 'Update data is required',
    };
  }

  try {
    const dataToUpdate = {
      ...updateProductData,
      updatedAt: new Date().getTime(),
    };

    const product = await db
      .collection(COLLECTION_NAME_FLEA_MARKET_PRODUCTS)
      .where({
        _id: productId,
        userId: openid,
      })
      .get();

    if (!product.data.length) {
      return {
        success: false,
        message: 'Product not found or you do not have permission to update it',
      };
    }

    const result = await db
      .collection(COLLECTION_NAME_FLEA_MARKET_PRODUCTS)
      .doc(productId)
      .update({
        data: dataToUpdate,
      });

    return {
      success: true,
      data: result._id,
      message: 'Item updated successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: 'Failed to update item',
    };
  }
};
