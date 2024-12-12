const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const MAX_LIMIT = 100;
const db = cloud.database();
const COLLECTION_NAME_PERKS = "partner-merchants";

exports.main = async (props, context) => {
  try {
    const countResult = await db.collection(COLLECTION_NAME_PERKS).count();
    const total = countResult.total;
    const batchTimes = Math.ceil(total / MAX_LIMIT);
    const tasks = [];
    for (let i = 0; i < batchTimes; i++) {
      const promise = db
        .collection(COLLECTION_NAME_PERKS)
        .orderBy("_updateTime", "desc")
        .skip(i * MAX_LIMIT)
        .limit(MAX_LIMIT)
        .get();
      tasks.push(promise);
    }
    const allResult = await Promise.all(tasks);
    let list = [];
    allResult.forEach((result) => {
      list = list.concat(result.data);
    });
    return {
      success: true,
      data: list,
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
