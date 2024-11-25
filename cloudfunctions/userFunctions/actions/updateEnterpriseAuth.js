const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();
const _ = db.command;
const COLLECTION_NAME_USERS = "users";
const COLLECTION_NAME_AUTH_REQUESTS = "auth-requests";

exports.main = async (props, context) => {
  const { authRequestIds } = props; // Input: array of auth-requests IDs to be updated

  if (!Array.isArray(authRequestIds) || authRequestIds.length === 0) {
    return {
      success: false,
      error: "Invalid input: authRequestIds must be a non-empty array.",
    };
  }

  const transaction = await db.startTransaction();

  try {
    // Batch retrieve information of pending auth requests
    const authRequestsRes = await transaction
      .collection(COLLECTION_NAME_AUTH_REQUESTS)
      .where({
        _id: _.in(authRequestIds),
        approved: false,
      })
      .get();

    const authRequests = authRequestsRes.data;

    if (authRequests.length === 0) {
      throw new Error(
        "No matching auth requests found or they are already approved."
      );
    }

    // Batch update the approved status in the auth-requests collection
    await transaction
      .collection(COLLECTION_NAME_AUTH_REQUESTS)
      .where({
        _id: _.in(authRequestIds),
      })
      .update({
        data: {
          approved: true,
          _updateTime: new Date().getTime(),
        },
      });

    // Batch update the company field of the corresponding users in the users collection
    const userUpdates = authRequests.map((authRequest) => ({
      _id: authRequest._id,
      data: {
        company: authRequest.company,
        _updateTime: new Date().getTime(),
      },
    }));

    for (const update of userUpdates) {
      await transaction
        .collection(COLLECTION_NAME_USERS)
        .doc(update._id)
        .update({
          data: update.data,
        });
    }

    // Commit the transaction
    await transaction.commit();

    return {
      success: true,
    };
  } catch (error) {
    // Rollback the transaction
    await transaction.rollback();
    return {
      success: false,
      error: error.message,
    };
  }
};
