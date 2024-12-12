import { cloudFunctionCall } from "./baseRepo";

const CLOUD_FUNCTION_COLLECTION = "luckDrawFunctions";
const COLLECTION_NAME = "luck-draws";
const db = wx.cloud.database();

export const fetchLuckDrawById = (luckDrawId) => {
  return db
    .collection(COLLECTION_NAME)
    .where({
      _id: luckDrawId,
    })
    .get();
};

export const fetchAllLuckDraws = () => {
  return cloudFunctionCall(CLOUD_FUNCTION_COLLECTION, "fetchAll", {});
};

export const fetchLatestLuckDraw = () => {
  return cloudFunctionCall(CLOUD_FUNCTION_COLLECTION, "fetchLatest", {});
};

export const createLuckDrawTicket = (luckDrawId) => {
  return cloudFunctionCall(CLOUD_FUNCTION_COLLECTION, "createTicket", {
    luckDrawId,
  });
};

export const draw = (luckDrawId) => {
  return cloudFunctionCall(CLOUD_FUNCTION_COLLECTION, "draw", {
    luckDrawId,
  });
};
