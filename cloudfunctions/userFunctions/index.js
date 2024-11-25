const updatePhoneNumber = require("./actions/updatePhoneNumber");
const fetchUserProfile = require("./actions/fetchUserProfile");
const fetchPendingAuthUsers = require("./actions/fetchPendingAuthUsers");
const createEnterpriseAuth = require("./actions/createEnterpriseAuth");
const updateEnterpriseAuth = require("./actions/updateEnterpriseAuth");
exports.main = async (event, context) => {
  const data = event.data;
  switch (event.action) {
    case "updatePhoneNumber":
      return await updatePhoneNumber.main(data, context);
    case "fetchUserProfile":
      return await fetchUserProfile.main(data, context);
    case "fetchPendingAuthUsers":
      return await fetchPendingAuthUsers.main(data, context);
    case "createEnterpriseAuth":
      return await createEnterpriseAuth.main(data, context);
    case "updateEnterpriseAuth":
      return await updateEnterpriseAuth.main(data, context);
  }
};
