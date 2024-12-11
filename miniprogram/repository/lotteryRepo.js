import { cloudFunctionCall } from "./baseRepo";

const CLOUD_FUNCTION_COLLECTION = "lotteryFunctions";
const COLLECTION_NAME_LOTTERIES = "lotteries";
const db = wx.cloud.database();

export const fetchLotteryById = (lotteryId) => {
  return db
    .collection(COLLECTION_NAME_LOTTERIES)
    .where({
      _id: lotteryId,
    })
    .get();
};

export const fetchAllLotteries = () => {
  return cloudFunctionCall(CLOUD_FUNCTION_COLLECTION, "fetchAllLotteries", {});
};

export const fetchLatestLottery = () => {
  return cloudFunctionCall(CLOUD_FUNCTION_COLLECTION, "fetchLatestLottery", {});
};

export const createLotteryTicket = (lotteryId) => {
  return cloudFunctionCall(CLOUD_FUNCTION_COLLECTION, "createLotteryTicket", {
    lotteryId,
  });
};

export const drawLottery = (lotteryId) => {
  return cloudFunctionCall(CLOUD_FUNCTION_COLLECTION, "drawLottery", {
    lotteryId,
  });
};
