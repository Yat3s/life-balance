const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

const COLLECTION_NAME = "luck-draws";

exports.main = async (props, context) => {
  try {
    const latest = await db
      .collection(COLLECTION_NAME)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    if (!latest.data[0]) {
      return {
        success: false,
        message: "No luck draw found",
      };
    }

    const phase = await db
      .collection(COLLECTION_NAME)
      .where({
        createdAt: db.command.lte(latest.data[0].createdAt),
      })
      .count();

    return {
      success: true,
      data: {
        ...latest.data[0],
        phase: phase.total,
      },
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
