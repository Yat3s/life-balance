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
const USER_BATCH_SIZE = 100; // WeChat database batch size limit

async function batchFetchUsers(db, userIds) {
  const batchTimes = Math.ceil(userIds.length / USER_BATCH_SIZE);
  const tasks = [];

  for (let i = 0; i < batchTimes; i++) {
    const start = i * USER_BATCH_SIZE;
    const batchUserIds = userIds.slice(start, start + USER_BATCH_SIZE);

    const promise = db
      .collection(COLLECTION_NAME_USERS)
      .where({
        _openid: _.in(batchUserIds),
      })
      .get();
    tasks.push(promise);
  }

  const userResults = await Promise.all(tasks);
  return userResults.reduce((acc, cur) => acc.concat(cur.data), []);
}

exports.main = async (props, context) => {
  try {
    const products = await getAllData(db, {
      collection: COLLECTION_NAME_FLEA_MARKET_PRODUCTS,
      whereCondition: {
        status: SALE_STATUS_ON,
      },
      orderBy: [
        { field: "terminated", type: "asc" },
        { field: "createdAt", type: "desc" },
      ],
    });

    // Extract unique userIds
    const userIds = [...new Set(products.map((product) => product.userId))];
    const userList = await batchFetchUsers(db, userIds);

    // Create user mapping for quick lookup
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
