const cloud = require("wx-server-sdk");
const { getAllData } = require("../lib/utils");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

const COLLECTION_NAME = "lotteries";

exports.main = async (props, context) => {
  try {
    const lotteries = await getAllData(db, {
      collection: COLLECTION_NAME,
      whereCondition: {},
      orderBy: {
        field: "created",
        type: "desc",
      },
    });

    return {
      success: true,
      data: lotteries,
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
