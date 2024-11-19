const cloud = require('wx-server-sdk');
const { getAllData } = require('../lib/utils');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

const COLLECTION_NAME_FLEA_MARKET_PRODUCTS = 'flea-market-products';
const SALE_STATUS_ON = 'on';

exports.main = async (props, context) => {
  try {
    const products = await getAllData(db, {
      collection: COLLECTION_NAME_FLEA_MARKET_PRODUCTS,
      whereCondition: {
        status: SALE_STATUS_ON,
      },
      orderBy: {
        field: 'updatedAt',
        type: 'desc',
      },
    });

    return {
      success: true,
      data: products,
      message: 'Data retrieved successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: 'Failed to retrieve data',
    };
  }
};
