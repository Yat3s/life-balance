import { cloudCall, cloudFunctionCall } from "./baseRepo";

const db = wx.cloud.database();

const CLOUD_FUNCTION_NAME = "glossaryFunctions"

export function queryGlossary(query) {
  const data = {
    query: query,
  }
  return cloudFunctionCall(CLOUD_FUNCTION_NAME, 'queryGlossary', data);
}