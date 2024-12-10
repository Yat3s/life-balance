import { cloudFunctionCall } from "./baseRepo";

const CLOUD_FUNCTION_COLLECTION = "lotteryFunctions";

export const fetchAllLotteries = () => {
  return cloudFunctionCall(CLOUD_FUNCTION_COLLECTION, "fetchAllLotteries", {});
};

export const createLotteryTicket = (lotteryId) => {
  return cloudFunctionCall(CLOUD_FUNCTION_COLLECTION, "createLotteryTicket", {
    lotteryId,
  });
};
