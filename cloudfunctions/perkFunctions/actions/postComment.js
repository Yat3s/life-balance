const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const COLLECTION_NAME_PERKS = "partner-merchants";
const COLLECTION_NAME_USERS = "users";

exports.main = async (props, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { partnerMerchantId, comment } = props;
  try {
    const userResult = await db
      .collection(COLLECTION_NAME_USERS)
      .where({
        _openid: openid,
      })
      .get();
    const user = userResult.data[0];

    if (!user) {
      return {
        success: false,
        message: "User not found",
      };
    }

    if (!user.company) {
      return {
        success: false,
        message: "User is not authorized to post comments",
      };
    }

    const savedComment = {
      user: {
        _id: user._id,
        _openid: user._openid,
        avatarUrl: user.avatarUrl,
        nickName: user.nickName,
      },
      content: comment.content,
      createdAt: new Date().getTime(),
    };

    await db
      .collection(COLLECTION_NAME_PERKS)
      .doc(partnerMerchantId)
      .update({
        data: {
          comments: db.command.push(savedComment),
        },
      });
    return {
      success: true,
      message: "Comment posted successfully",
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: "Failed to post comment",
    };
  }
};
