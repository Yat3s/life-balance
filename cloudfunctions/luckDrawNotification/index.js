const cloud = require("wx-server-sdk");
const { performLuckDraw } = require("./lib/luck-draw");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;
const COLLECTION_NAME = "luck-draws";
const TEMPLATE_ID = "wV8HUYugxQ3OI9MBkEPXMutZnOPHtQsu1tdMCoxOgi8";
const MINIPROGRAM_STATE = "trial";

exports.main = async (event, context) => {
  // Add trigger source check
  const wxContext = cloud.getWXContext();
  if (wxContext.SOURCE !== "wx_trigger") {
    console.log("[LuckDraw] Skipping execution - not triggered by timer");
    return;
  }

  try {
    const now = Date.now();
    const luckDraw = await db
      .collection(COLLECTION_NAME)
      .where({
        drawnAt: _.lte(now),
        winners: _.size(0),
      })
      .get();

    if (!luckDraw.data.length) {
      console.log("[LuckDraw] No luck draw events need to be drawn");
      return;
    }

    const currentLuckDraw = luckDraw.data[0];
    const { winners, nonWinners } = performLuckDraw(
      currentLuckDraw.tickets,
      currentLuckDraw.prizeTiers
    );

    await db
      .collection(COLLECTION_NAME)
      .doc(currentLuckDraw._id)
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

    const nonWinnerPromises = nonWinners.map((userId) =>
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
        winners.length + nonWinners.length
      }`
    );
  } catch (error) {
    console.error("[LuckDraw] Draw execution failed:", error);
  }
};
