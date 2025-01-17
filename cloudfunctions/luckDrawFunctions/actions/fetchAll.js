const cloud = require("wx-server-sdk");
const { getAllData } = require("../lib/utils");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

const COLLECTION_NAME = "luck-draws";

exports.main = async (props, context) => {
  try {
    const luckDraws = await getAllData(db, {
      collection: COLLECTION_NAME,
      whereCondition: {},
      orderBy: {
        field: "_createTime",
        type: "desc",
      },
    });

    return {
      success: true,
      data: luckDraws,
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
