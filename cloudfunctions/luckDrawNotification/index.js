const cloud = require("wx-server-sdk");
const { performLuckDraw } = require("./lib/luck-draw");
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;
const COLLECTION_NAME = "luck-draws";
const TEMPLATE_ID = "wV8HUYugxQ3OI9MBkEPXMutZnOPHtQsu1tdMCoxOgi8";
const MINIPROGRAM_STATE = "trial";

const NOTIFICATIONS = {
  winner: {
    message: "恭喜您中奖啦！",
    endMessage: "中奖用户请联系：Yat3s 领取奖品",
  },
  nonWinner: {
    message: "很遗憾未能中奖，感谢参与",
    endMessage: "下次活动将会更精彩",
  },
};

const sendNotification = async (userId, title, isWinner) => {
  try {
    const template = isWinner ? NOTIFICATIONS.winner : NOTIFICATIONS.nonWinner;
    await cloud.openapi.subscribeMessage.send({
      touser: userId,
      templateId: TEMPLATE_ID,
      miniprogram_state: MINIPROGRAM_STATE,
      page: `/pages/luck-draw/luck-draw`,
      data: {
        thing1: { value: title },
        thing3: { value: template.message },
        thing8: { value: template.endMessage },
      },
    });
  } catch (error) {
    console.error(`[Notification] Send failed (userId: ${userId}):`, error);
  }
};

const getLuckDraw = async (event) => {
  const wxContext = cloud.getWXContext();

  if (wxContext.SOURCE === "wx_trigger") {
    const now = Date.now();
    const result = await db
      .collection(COLLECTION_NAME)
      .where({
        drawnAt: _.lte(now),
        winners: _.size(0),
      })
      .get();

    return result.data[0];
  }

  const luckDrawId = event.data?.luckDrawId;
  const luckDrawActionName = event.action;

  if (luckDrawActionName === "draw" && luckDrawId) {
    const result = await db.collection(COLLECTION_NAME).doc(luckDrawId).get();

    return result.data;
  }

  return null;
};

exports.main = async (event, context) => {
  try {
    const currentLuckDraw = await getLuckDraw(event);

    if (!currentLuckDraw) {
      return { success: false, error: "No luck draw found" };
    }

    if (currentLuckDraw.winners?.length > 0) {
      return { success: false, error: "Luck draw already drawn" };
    }

    const tickets = currentLuckDraw.tickets.map(({ code, userId }) => ({
      code,
      userId,
    }));
    const prizeTiers = currentLuckDraw.prizeTiers.map(({ count, tier }) => ({
      count,
      tier,
    }));

    const drawResult = performLuckDraw(tickets, prizeTiers);

    const winners = [];
    const updatedTickets = currentLuckDraw.tickets.map((ticket) => {
      for (const [tierName, { winners: tierWinners }] of Object.entries(
        drawResult
      )) {
        if (tierWinners.includes(ticket.code)) {
          winners.push({
            ticketId: ticket.code,
            userId: ticket.userId,
            user: ticket.user,
          });
          return { ...ticket, prizeTier: tierName };
        }
      }
      return ticket;
    });

    await db
      .collection(COLLECTION_NAME)
      .doc(currentLuckDraw._id)
      .update({
        data: { winners, tickets: updatedTickets },
      });

    const winnerIds = new Set(winners.map((w) => w.userId));
    const notificationPromises = currentLuckDraw.tickets.map((ticket) =>
      sendNotification(
        ticket.userId,
        currentLuckDraw.title,
        winnerIds.has(ticket.userId)
      )
    );

    await Promise.all(notificationPromises);

    return {
      success: true,
      data: { drawResult, winners },
    };
  } catch (error) {
    console.error("[LuckDraw] Failed:", error);
    return { success: false, error: error.message };
  }
};
