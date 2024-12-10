const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();
const COLLECTION_NAME_PERKS = "partner-merchants";
const COLLECTION_NAME_USERS = "users";

exports.main = async (props, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { partnerMerchantId, commentInfo } = props;

  try {
    // get user info
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

    // get partner merchant comments
    const partnerMerchant = await db
      .collection(COLLECTION_NAME_PERKS)
      .doc(partnerMerchantId)
      .get();
    const comments = partnerMerchant.data.comments;

    // find comment to delete
    const commentToDelete = comments.find(
      (comment) =>
        comment.createdAt === commentInfo.createdAt &&
        comment._openid === commentInfo._openid &&
        comment.content === commentInfo.content
    );

    if (!commentToDelete) {
      return {
        success: false,
        message: "Comment not found or you can only delete your own comments",
      };
    }

    // delete comment
    await db
      .collection(COLLECTION_NAME_PERKS)
      .doc(partnerMerchantId)
      .update({
        data: {
          comments: db.command.pull({
            createdAt: commentInfo.createdAt,
            _openid: commentInfo._openid,
            commentText: commentInfo.commentText,
          }),
        },
      });

    return {
      success: true,
      message: "Comment deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting comment:", error);
    return {
      success: false,
      message: "Failed to delete comment",
      error: error.message,
    };
  }
};
