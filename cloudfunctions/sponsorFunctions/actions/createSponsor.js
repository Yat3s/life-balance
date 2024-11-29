const cloud = require("wx-server-sdk");
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const COLLECTION_NAME_SPONSORS = "sponsors";

exports.main = async (props, context) => {
  const openid = cloud.getWXContext().OPENID;
  const { createSponsorData } = props;

  try {
    const res = await db.collection(COLLECTION_NAME_SPONSORS).add({
      data: {
        ...createSponsorData,
        userId: openid,
        paidAt: Date.now(),
      },
    });

    return {
      success: true,
      message: "Sponsor payment record created successfully",
      res,
    };
  } catch (error) {
    console.error("Failed to create sponsor record:", error);
    return {
      success: false,
      message: "Failed to create sponsor record",
      error: error.message,
    };
  }
};
