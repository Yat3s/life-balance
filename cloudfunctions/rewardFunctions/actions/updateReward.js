const cloud = require("wx-server-sdk");
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const COLLECTION_NAME_REWARDS = "rewards";

exports.main = async (props, context) => {
  const openid = cloud.getWXContext().OPENID;
  const { rewardId, updateRewardData } = props;

  try {
    const reward = await db
      .collection(COLLECTION_NAME_REWARDS)
      .doc(rewardId)
      .get();

    if (reward.data.userId !== openid) {
      return {
        success: false,
        message: "No permission to update this reward",
      };
    }

    const result = await db
      .collection(COLLECTION_NAME_REWARDS)
      .doc(rewardId)
      .update({
        data: {
          ...updateRewardData,
          paidAt: Date.now(),
          paymentStatus: "SUCCESS",
        },
      });

    return {
      success: true,
      message: "Reward payment status updated successfully",
      result,
    };
  } catch (error) {
    console.error("Failed to update reward payment status:", error);
    return {
      success: false,
      message: "Failed to update reward payment status",
      error: error.message,
    };
  }
};
