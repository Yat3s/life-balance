const cloud = require('wx-server-sdk');
const { getAllData } = require('../lib/utils');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

const COLLECTION_NAME_PRODUCTS = 'products';

exports.main = async (props, context) => {
  try {
    const products = await getAllData(db, {
      collection: COLLECTION_NAME_PRODUCTS,
      whereCondition: {},
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
