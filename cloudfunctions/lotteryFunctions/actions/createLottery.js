const cloud = require("wx-server-sdk");
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const COLLECTION_LOTTERIES = "lotteries";
const COLLECTION_USERS = "users";

exports.main = async (event, context) => {
  const db = cloud.database();
  const wxContext = cloud.getWXContext();

  try {
    const isAdmin = await checkIsAdmin(wxContext.OPENID);
    if (!isAdmin) {
      throw new Error("没有创建权限");
    }

    const { title, description, drawnAt, prizeTiers } = event;

    const result = await db.collection(COLLECTION_LOTTERIES).add({
      data: {
        title,
        description,
        drawnAt,
        prizeTiers,
        tickets: [],
        winners: [],
        createdAt: Date.now(),
        createdBy: wxContext.OPENID,
      },
    });

    return {
      success: true,
      data: { id: result._id },
      message: "抽奖活动创建成功",
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: "创建抽奖活动失败",
    };
  }
};

async function checkIsAdmin(openid) {
  const db = cloud.database();
  const user = await db
    .collection(COLLECTION_USERS)
    .where({ _openid: openid })
    .get();

  return user.data[0]?.role === 1024;
}
