const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();
const _ = db.command;
const COLLECTION_NAME_USERS = "users";
const COLLECTION_NAME_AUTH_REQUESTS = "auth-requests";

exports.main = async (props, context) => {
  const { authRequestIds } = props; // 传入需要更新的 auth-requests 的 id 数组

  if (!Array.isArray(authRequestIds) || authRequestIds.length === 0) {
    return {
      success: false,
      error: "Invalid input: authRequestIds must be a non-empty array.",
    };
  }

  const transaction = await db.startTransaction();

  try {
    // 批量获取待认证请求信息
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

    // 批量更新 auth-requests 集合中的 approved 状态
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

    // 批量更新 users 集合中对应用户的 company 字段
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

    // 提交事务
    await transaction.commit();

    return {
      success: true,
    };
  } catch (error) {
    // 事务回滚
    await transaction.rollback();
    return {
      success: false,
      error: error.message,
    };
  }
};
