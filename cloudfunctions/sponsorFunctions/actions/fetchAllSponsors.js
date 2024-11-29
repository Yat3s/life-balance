const cloud = require("wx-server-sdk");
const { getAllData } = require("../lib/utils");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

const COLLECTION_NAME_SPONSORS = "sponsors";

exports.main = async (props, context) => {
  try {
    const sponsors = await getAllData(db, {
      collection: COLLECTION_NAME_SPONSORS,
      whereCondition: {},
      orderBy: {
        field: "paidAt",
        type: "desc",
      },
    });

    return {
      success: true,
      data: sponsors,
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
