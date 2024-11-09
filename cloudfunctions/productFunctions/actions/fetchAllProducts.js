const cloud = require('wx-server-sdk');
const { getAllData } = require('../lib/utils');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

const COLLECTION_NAME_PRODUCTS = 'products';
const SALE_STATUS = 'on';

exports.main = async (props, context) => {
  try {
    const products = await getAllData(db, {
      collection: COLLECTION_NAME_PRODUCTS,
      whereCondition: {
        saleStatus: SALE_STATUS,
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
    return {
      success: false,
      error: error.message,
      message: 'Failed to retrieve data',
    };
  }
};
