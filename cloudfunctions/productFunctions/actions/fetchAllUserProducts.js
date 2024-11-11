const cloud = require('wx-server-sdk');
const { getAllData } = require('../lib/utils');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

const COLLECTION_NAME_PRODUCTS = 'products';
const PRODUCT_TYPE = 'secondhand';

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();

  try {
    const products = await getAllData(db, {
      collection: COLLECTION_NAME_PRODUCTS,
      whereCondition: {
        userId: wxContext.OPENID,
        type: PRODUCT_TYPE,
      },
      orderBy: {
        field: 'createdAt',
        type: 'desc',
      },
    });

    return {
      success: true,
      data: products,
      message: 'Data retrieved successfully',
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to retrieve data',
    };
  }
};
