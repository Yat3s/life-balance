const cloud = require("wx-server-sdk");
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;
const COLLECTION_NAME = "luck-draws";
const TEMPLATE_ID = "wV8HUYugxQ3OI9MBkEPXMutZnOPHtQsu1tdMCoxOgi8";
const MINIPROGRAM_STATE = "trial";

exports.main = async (props, context) => {
  const { luckDrawId } = props;

  try {
    const luckDraw = await db.collection(COLLECTION_NAME).doc(luckDrawId).get();

    if (!luckDraw.data) {
      console.log(`[LuckDraw] Luck draw with ID ${luckDrawId} not found`);
      return {
        success: false,
        error: "Luck draw not found",
      };
    }

    const currentLuckDraw = luckDraw.data;

    // Check if luck draw has already been drawn
    if (currentLuckDraw.winners && currentLuckDraw.winners.length > 0) {
      console.log(`[LuckDraw] Luck draw ${luckDrawId} has already been drawn`);
      return {
        success: false,
        error: "Luck draw already drawn",
      };
    }

    const winners = [];
    const nonWinnerUserIds = new Set(
      currentLuckDraw.tickets.map((ticket) => ticket.userId)
    );

    for (const prizeTier of currentLuckDraw.prizeTiers) {
      const tickets = [...currentLuckDraw.tickets];
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
      .doc(luckDrawId)
      .update({
        data: {
          winners: winners,
        },
      });

    console.log(
      `[LuckDraw] Draw completed for "${currentLuckDraw.title}", number of winners: ${winners.length}`
    );

    const winnerPromises = winners.map((winner) =>
      cloud.openapi.subscribeMessage
        .send({
          touser: winner.userId,
          templateId: TEMPLATE_ID,
          miniprogram_state: MINIPROGRAM_STATE,
          page: `/pages/luck-draw/luck-draw`,
          data: {
            thing1: { value: currentLuckDraw.title },
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
          miniprogram_state: MINIPROGRAM_STATE,
          page: `/pages/luck-draw/luck-draw`,
          data: {
            thing1: { value: currentLuckDraw.title },
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
    console.error("[LuckDraw] Draw execution failed:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
