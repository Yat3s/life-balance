import { cloudCall, cloudFunctionCall } from "./baseRepo";

const db = wx.cloud.database();

const CLOUD_FUNCTION_NAME = "circleFunctions";
const COLLECTION_NAME = "wechatgroups";

export function addCircle(addCircleData) {
  return cloudFunctionCall(CLOUD_FUNCTION_NAME, "addCircle", addCircleData);
}
