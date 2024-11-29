const cloud = require("wx-server-sdk");
const { getAllData } = require("../lib/utils");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();
const _ = db.command;

const COLLECTION_NAME_FLEA_MARKET_PRODUCTS = "flea-market-products";
const COLLECTION_NAME_USERS = "users";
const SALE_STATUS_ON = "on";

exports.main = async (props, context) => {
  try {
    const products = await getAllData(db, {
      collection: COLLECTION_NAME_FLEA_MARKET_PRODUCTS,
      whereCondition: {
        status: SALE_STATUS_ON,
      },
      orderBy: {
        field: "updatedAt",
        type: "desc",
      },
    });

    // Extract unique userIds
    const userIds = [...new Set(products.map((product) => product.userId))];

    // Batch fetch user information
    const userList = await db
      .collection(COLLECTION_NAME_USERS)
      .where({
        _openid: _.in(userIds),
      })
      .get()
      .then((res) => res.data);

    const userMap = userList.reduce((acc, user) => {
      acc[user._openid] = user;
      return acc;
    }, {});

    const productsWithUsers = products.map((product) => ({
      ...product,
      user: userMap[product.userId],
    }));

    return {
      success: true,
      data: productsWithUsers,
      message: "Data retrieved successfully",
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: "Failed to retrieve data",
    };
  }
};
