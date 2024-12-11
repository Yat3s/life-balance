const cloud = require("wx-server-sdk");
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const COLLECTION_NAME = "lotteries";
const TEMPLATE_ID = "wV8HUYugxQ3OI9MBkEPXMutZnOPHtQsu1tdMCoxOgi8";
const db = cloud.database();
const _ = db.command;

exports.main = async (props, context) => {
  const { lotteryId } = props;

  try {
    const lottery = await db.collection(COLLECTION_NAME).doc(lotteryId).get();

    if (!lottery.data) {
      console.log(`[Lottery] Lottery with ID ${lotteryId} not found`);
      return {
        success: false,
        error: "Lottery not found",
      };
    }

    const currentLottery = lottery.data;

    // Check if lottery has already been drawn
    if (currentLottery.winners && currentLottery.winners.length > 0) {
      console.log(`[Lottery] Lottery ${lotteryId} has already been drawn`);
      return {
        success: false,
        error: "Lottery already drawn",
      };
    }

    const winners = [];
    const nonWinnerUserIds = new Set(
      currentLottery.tickets.map((ticket) => ticket.userId)
    );

    for (const prizeTier of currentLottery.prizeTiers) {
      const tickets = [...currentLottery.tickets];
      for (let i = 0; i < prizeTier.count; i++) {
        if (tickets.length === 0) break;

        const randomIndex = Math.floor(Math.random() * tickets.length);
        const winningTicket = tickets[randomIndex];

        winners.push({
          ticketId: winningTicket.code,
          userId: winningTicket.userId,
          user: winningTicket.user,
          prizeTier: prizeTier.tier,
          prizeName: prizeTier.name,
        });

        nonWinnerUserIds.delete(winningTicket.userId);
        tickets.splice(randomIndex, 1);
      }
    }

    await db
      .collection(COLLECTION_NAME)
      .doc(lotteryId)
      .update({
        data: {
          winners: winners,
        },
      });

    console.log(
      `[Lottery] Draw completed for "${currentLottery.title}", number of winners: ${winners.length}`
    );

    const winnerPromises = winners.map((winner) =>
      cloud.openapi.subscribeMessage
        .send({
          touser: winner.userId,
          templateId: TEMPLATE_ID,
          miniprogram_state: "trial",
          page: `/pages/lottery/lottery`,
          data: {
            thing1: { value: currentLottery.title },
            thing3: { value: "恭喜您中奖啦！" },
            thing8: { value: "中奖用户请联系：Yat3s 领取奖品" },
          },
        })
        .catch((error) => {
          console.error(
            `[Notification] Failed to send winner notification (userId: ${winner.userId}):`,
            error
          );
        })
    );

    const nonWinnerPromises = Array.from(nonWinnerUserIds).map((userId) =>
      cloud.openapi.subscribeMessage
        .send({
          touser: userId,
          templateId: TEMPLATE_ID,
          data: {
            thing1: { value: currentLottery.title },
            thing3: { value: "很遗憾未能中奖，感谢参与" },
            thing8: { value: "下次活动将会更精彩" },
          },
        })
        .catch((error) => {
          console.error(
            `[Notification] Failed to send non-winner notification (userId: ${userId}):`,
            error
          );
        })
    );

    await Promise.all([...winnerPromises, ...nonWinnerPromises]);
    console.log(
      `[Notification] All notifications sent, total: ${
        winners.length + nonWinnerUserIds.size
      }`
    );

    return {
      success: true,
    };
  } catch (error) {
    console.error("[Lottery] Draw execution failed:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
