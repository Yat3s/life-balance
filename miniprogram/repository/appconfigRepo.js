import { cloudFunctionCall } from "./baseRepo";

const CLOUD_FUNCTION_COLLECTION = "appconfigFunctions";

export const updateAppconfig = (id, updateInfo) => {
  return cloudFunctionCall(CLOUD_FUNCTION_COLLECTION, "updateAppconfig", {
    id,
    updateInfo,
  });
};
