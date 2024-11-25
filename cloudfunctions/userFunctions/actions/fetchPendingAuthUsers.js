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
    // 获取当前登录用户的信息
    const currentUser = await db
      .collection(COLLECTION_NAME_USERS)
      .where({
        _openid: openid,
      })
      .get();

    if (currentUser.data.length === 0) {
      return {
        success: false,
        error: "当前用户不存在",
      };
    }

    const user = currentUser.data[0];

    // 检查当前用户的角色是否为 1024
    if (user.role !== 1024) {
      return {
        success: false,
        error: "权限不足",
      };
    }

    // 查询待认证的用户列表，条件为 approved 为 false
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
