import { cloudFunctionCall } from "./baseRepo";

const CLOUD_FUNCTION_COLLECTION = "sponsorFunctions";

export const createOrder = (amount) => {
  return cloudFunctionCall(CLOUD_FUNCTION_COLLECTION, "createOrder", {
    amount,
  });
};

export const createSponsor = (createSponsorData) => {
  return cloudFunctionCall(CLOUD_FUNCTION_COLLECTION, "createSponsor", {
    createSponsorData,
  });
};

export const fetchAllSponsors = () => {
  return cloudFunctionCall(CLOUD_FUNCTION_COLLECTION, "fetchAllSponsors", {});
};
