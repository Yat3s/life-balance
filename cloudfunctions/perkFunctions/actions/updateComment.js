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
  const { partnerMerchantId, commentInfo, newCommentText } = props;

  try {
    // Get user info
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

    // Get partner merchant comments
    const partnerMerchant = await db
      .collection(COLLECTION_NAME_PERKS)
      .doc(partnerMerchantId)
      .get();
    const comments = partnerMerchant.data.comments;

    // Find the comment to update
    const commentToUpdate = comments.find(
      (comment) =>
        comment.createdAt === commentInfo.createdAt &&
        comment._openid === commentInfo._openid &&
        comment.content === commentInfo.content
    );

    if (!commentToUpdate) {
      return {
        success: false,
        message: "Comment not found or you can only update your own comments",
      };
    }

    // Update comment
    await db
      .collection(COLLECTION_NAME_PERKS)
      .doc(partnerMerchantId)
      .update({
        data: {
          comments: db.command.set(
            comments.map((comment) =>
              comment.createdAt === commentInfo.createdAt &&
              comment._openid === commentInfo._openid &&
              comment.content === commentInfo.content
                ? {
                    ...comment,
                    content: newCommentText,
                    updatedAt: new Date().getTime(),
                  }
                : comment
            )
          ),
        },
      });

    return {
      success: true,
      message: "Comment updated successfully",
    };
  } catch (error) {
    console.error("Error updating comment:", error);
    return {
      success: false,
      message: "Failed to update comment",
      error: error.message,
    };
  }
};
