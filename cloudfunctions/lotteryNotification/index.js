const cloud = require("wx-server-sdk");
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;
const COLLECTION_NAME = "lotteries";
const TEMPLATE_ID = "wV8HUYugxQ3OI9MBkEPXMutZnOPHtQsu1tdMCoxOgi8";

exports.main = async (event, context) => {
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
      console.log("[Lottery] No lottery events need to be drawn");
      return;
    }

    const currentLottery = lottery.data[0];
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
        });

        nonWinnerUserIds.delete(winningTicket.userId);
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
  } catch (error) {
    console.error("[Lottery] Draw execution failed:", error);
  }
};
