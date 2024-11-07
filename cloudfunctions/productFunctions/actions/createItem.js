const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;
const COLLECTION_NAME_PRODUCTS = 'products';

exports.main = async (props, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { createItemData } = props;

  try {
    const dataToInsert = {
      ...createItemData,
      userId: openid,
      createdAt: new Date().getTime(),
    };

    const result = await db.collection(COLLECTION_NAME_PRODUCTS).add({
      data: dataToInsert,
    });

    return {
      success: true,
      data: result._id,
      message: 'Item created successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: 'Failed to create item',
    };
  }
};
