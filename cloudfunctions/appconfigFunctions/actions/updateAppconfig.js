const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();
const _ = db.command;
const COLLECTION_NAME_USERS = "users";
const COLLECTION_NAME_APPCONFIG = "appconfig";

exports.main = async (props, context) => {
  const { id, updateInfo } = props; // Input: id of appconfig to update, updateInfo is the fields to update

  if (
    !id ||
    typeof updateInfo !== "object" ||
    Object.keys(updateInfo).length === 0
  ) {
    return {
      success: false,
      error: "Invalid input: id and updateInfo must be provided.",
    };
  }

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

    // Check if the current user's role is 1024 (admin)
    if (user.role !== 1024) {
      return {
        success: false,
        error: "Insufficient permissions. Only admins can update appconfig.",
      };
    }

    // Update the appconfig document with the provided id
    const updateResult = await db
      .collection(COLLECTION_NAME_APPCONFIG)
      .doc(id)
      .update({
        data: {
          ...updateInfo,
          _updateTime: new Date().getTime(),
        },
      });

    if (updateResult.stats.updated === 0) {
      return {
        success: false,
        error: "Appconfig update failed. Please check the ID or fields.",
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};
