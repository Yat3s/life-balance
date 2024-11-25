const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});
const db = cloud.database();
const _ = db.command;
const COLLECTION_NAME_USERS = "users";
const COLLECTION_NAME_AUTH_REQUESTS = "auth-requests";

exports.main = async (props, context) => {
  const openid = cloud.getWXContext().OPENID;

  try {
    // Get the current logged-in user's information
    const currentUser = await db
      .collection(COLLECTION_NAME_USERS)
      .where({
        _openid: openid,
      })
      .get();

    if (currentUser.data.length === 0) {
      return {
        success: false,
        error: "Current user does not exist",
      };
    }

    const user = currentUser.data[0];

    // Check if the current user's role is 1024
    if (user.role !== 1024) {
      return {
        success: false,
        error: "Insufficient permissions",
      };
    }

    // Query the list of users pending authentication, where approved is false
    const authRequests = await db
      .collection(COLLECTION_NAME_AUTH_REQUESTS)
      .where({
        approved: false,
      })
      .get();

    return {
      success: true,
      data: authRequests.data,
    };
  } catch (error) {
    return {
      success: false,
      error,
    };
  }
};
