const cloud = require("wx-server-sdk");
const createId = require("cuid");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const COLLECTION_LOTTERIES = "lotteries";
const COLLECTION_USERS = "users";

exports.main = async (props, context) => {
  const wxContext = cloud.getWXContext();
  const db = cloud.database();
  const _ = db.command;

  try {
    const code = createId();

    const lottery = await db
      .collection(COLLECTION_LOTTERIES)
      .doc(props.lotteryId)
      .get();

    const tickets = lottery.data.tickets || [];

    const hasParticipated = tickets.some(
      (ticket) => ticket.userId === wxContext.OPENID
    );

    if (hasParticipated) {
      return {
        success: false,
        message: "您已经参与过本次抽奖",
      };
    }

    const userInfo = (
      await db
        .collection(COLLECTION_USERS)
        .where({
          _openid: wxContext.OPENID,
        })
        .get()
    ).data[0];

    if (!userInfo) {
      return {
        success: false,
        message: "找不到用户信息",
      };
    }

    await db
      .collection(COLLECTION_LOTTERIES)
      .doc(props.lotteryId)
      .update({
        data: {
          tickets: _.push({
            userId: wxContext.OPENID,
            code,
            user: {
              _id: userInfo._id,
              _openid: userInfo._openid,
              avatarUrl: userInfo.avatarUrl,
              nickName: userInfo.nickName,
              ...(userInfo.company ? { company: userInfo.company } : {}),
            },
            createdAt: Date.now(),
          }),
        },
      });

    return {
      success: true,
      data: {
        code,
        userInfo,
      },
      message: "参与抽奖成功",
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: "参与抽奖失败",
    };
  }
};
