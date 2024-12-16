import { cloudCall, cloudFunctionCall } from "./baseRepo";

const CLOUD_FUNCTION_COLLECTION = "luckDrawFunctions";
const LUCK_DRAW_CLOUD_FUNCTION = "luckDraw";
const COLLECTION_NAME = "luck-draws";
const db = wx.cloud.database();

export const fetchLuckDrawById = (luckDrawId) => {
  return cloudCall(db.collection(COLLECTION_NAME).doc(luckDrawId).get());
};

export const fetchLatestLuckDraw = () => {
  return cloudCall(
    db.collection(COLLECTION_NAME).orderBy("_createTime", "desc").limit(1).get()
  );
};

export const fetchAllLuckDraws = () => {
  return cloudFunctionCall(CLOUD_FUNCTION_COLLECTION, "fetchAll", {});
};

export const createLuckDrawTicket = (luckDrawId) => {
  return cloudFunctionCall(CLOUD_FUNCTION_COLLECTION, "createTicket", {
    luckDrawId,
  });
};

export const draw = (luckDrawId) => {
  return cloudFunctionCall(LUCK_DRAW_CLOUD_FUNCTION, "draw", {
    luckDrawId,
  });
};
