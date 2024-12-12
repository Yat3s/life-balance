import { cloudCall, cloudFunctionCall } from "./baseRepo";

const CLOUD_FUNCTION_COLLECTION = "luckDrawFunctions";
const COLLECTION_NAME = "luck-draws";
const db = wx.cloud.database();
const _ = db.command;

export const fetchLuckDrawById = (luckDrawId) => {
  return cloudCall(
    db
      .collection(COLLECTION_NAME)
      .where({
        _id: luckDrawId,
      })
      .get()
  );
};

export const fetchLatestLuckDraw = () => {
  return cloudCall(
    db.collection(COLLECTION_NAME).orderBy("createdAt", "desc").limit(1).get()
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
  return cloudFunctionCall(CLOUD_FUNCTION_COLLECTION, "draw", {
    luckDrawId,
  });
};
