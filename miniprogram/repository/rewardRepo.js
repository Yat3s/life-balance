import { cloudFunctionCall } from "./baseRepo";

const CLOUD_FUNCTION_COLLECTION = "rewardFunctions";

export const createReward = (amount) => {
  return cloudFunctionCall(CLOUD_FUNCTION_COLLECTION, "createReward", {
    amount,
  });
};

export const updateReward = (rewardId, updateRewardData) => {
  return cloudFunctionCall(CLOUD_FUNCTION_COLLECTION, "updateReward", {
    rewardId,
    updateRewardData,
  });
};
