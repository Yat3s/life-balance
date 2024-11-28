const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;
const COLLECTION_NAME_CIRCLES = "wechatgroups";

exports.main = async (props, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    const dataToInsert = {
      ...props,
      createdBy: openid,
      code: "",
      memberCount: 0,
      participants: [],
      _createTime: new Date().getTime(),
      _updateTime: new Date().getTime(),
    };

    const result = await db.collection(COLLECTION_NAME_CIRCLES).add({
      data: dataToInsert,
    });

    return {
      success: true,
      data: result._id,
      message: "Circle created successfully",
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: "Failed to create circle",
    };
  }
};
