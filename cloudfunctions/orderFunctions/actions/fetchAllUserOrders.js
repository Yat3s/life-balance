const cloud = require('wx-server-sdk');
const { getAllData } = require('../lib/utils');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

const COLLECTION_NAME_ORDERS = 'orders';

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();

  try {
    const orders = await getAllData(db, {
      collection: COLLECTION_NAME_ORDERS,
      whereCondition: {
        userId: wxContext.OPENID,
      },
      orderBy: {
        field: 'createdAt',
        type: 'desc',
      },
    });

    return {
      success: true,
      data: orders,
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
