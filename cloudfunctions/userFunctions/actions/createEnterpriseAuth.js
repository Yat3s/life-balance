const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();
const _ = db.command;
const COLLECTION_NAME_USERS = "users";
const COLLECTION_NAME_AUTH_REQUESTS = "auth-requests";

exports.main = async (props, context) => {
  const { enterpriseAuthInfo } = props;

  const transaction = await db.startTransaction();

  try {
    // fetch user info
    const userRes = await transaction
      .collection(COLLECTION_NAME_USERS)
      .doc(enterpriseAuthInfo.userId)
      .get();
    if (!userRes.data) {
      throw new Error("User info not found.");
    }

    const userInfo = userRes.data;

    // update user info with provided updatedUserInfo
    await transaction
      .collection(COLLECTION_NAME_USERS)
      .doc(enterpriseAuthInfo.userId)
      .update({
        data: {
          ...enterpriseAuthInfo.updatedUserInfo,
          // Here you can add any fields you want to update in the users table
          _updateTime: new Date().getTime(),
        },
      });

    // add a copy of user info to auth-requests collection
    await transaction.collection(COLLECTION_NAME_AUTH_REQUESTS).add({
      data: {
        _id: userInfo._id,
        _openid: userInfo._openid,
        nickName: userInfo.nickName,
        avatarUrl: userInfo.avatarUrl,
        contact: enterpriseAuthInfo.updatedUserInfo.contact,
        approved: false,
        company: enterpriseAuthInfo.company,
        _createTime: new Date().getTime(),
      },
    });

    // commit transaction
    await transaction.commit();

    return {
      success: true,
    };
  } catch (error) {
    // rollback transaction
    await transaction.rollback();
    return {
      success: false,
      error: error.message,
    };
  }
};
