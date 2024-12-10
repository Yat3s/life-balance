const cloud = require("wx-server-sdk");
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const COLLECTION_NAME = "lotteries";

exports.main = async (event, context) => {
  const db = cloud.database();
  const _ = db.command;

  try {
    const now = Date.now();
    const lottery = await db
      .collection(COLLECTION_NAME)
      .where({
        drawnAt: _.lte(now),
        winners: _.size(0),
      })
      .get();

    if (!lottery.data.length) {
      return {
        success: true,
        message: "没有需要开奖的活动",
      };
    }

    const currentLottery = lottery.data[0];

    const winners = [];
    for (const prizeTier of currentLottery.prizeTiers) {
      const tickets = currentLottery.tickets;
      for (let i = 0; i < prizeTier.count; i++) {
        if (tickets.length === 0) break;

        const randomIndex = Math.floor(Math.random() * tickets.length);
        const winningTicket = tickets[randomIndex];

        winners.push({
          ticketId: winningTicket.code,
          userId: winningTicket.userId,
          prizeTier: prizeTier.tier,
        });

        tickets.splice(randomIndex, 1);
      }
    }

    await db
      .collection(COLLECTION_NAME)
      .doc(currentLottery._id)
      .update({
        data: {
          winners: winners,
        },
      });

    for (const winner of winners) {
      try {
        await cloud.openapi.subscribeMessage.send({
          touser: winner.userId,
          templateId: "YOUR_TEMPLATE_ID",
          data: {
            thing1: { value: currentLottery.title },
            thing2: { value: `恭喜您获得${winner.prizeTier}奖项` },
            time3: { value: new Date().toLocaleString() },
          },
        });
      } catch (error) {
        console.error("发送订阅消息失败:", error);
      }
    }

    return {
      success: true,
      data: { winners },
      message: "开奖完成",
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: "开奖失败",
    };
  }
};
