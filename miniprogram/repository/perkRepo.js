import { cloudFunctionCall } from "./baseRepo";

const CLOUD_FUNCTION_COLLECTION = "perkFunctions";
const COLLECTION_NAME_PARTNER_MERCHANTS = "partner-merchants";
const db = wx.cloud.database();

export const fetchPartnerMerchant = (partnerMerchantId) => {
  return db
    .collection(COLLECTION_NAME_PARTNER_MERCHANTS)
    .where({
      _id: partnerMerchantId,
    })
    .get();
};

export const fetchAllPartnerMerchants = () => {
  return cloudFunctionCall(
    CLOUD_FUNCTION_COLLECTION,
    "fetchAllPartnerMerchants"
  );
};

export const postComment = (partnerMerchantId, comment) => {
  return cloudFunctionCall(CLOUD_FUNCTION_COLLECTION, "postComment", {
    partnerMerchantId,
    comment,
  });
};
