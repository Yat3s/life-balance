import { formatDate } from "../lib/utils";
import { cloudCall, cloudFunctionCall } from "./baseRepo";

const CLOUD_FUNCTION_COLLECTION = "luckDrawFunctions";
const LUCK_DRAW_CLOUD_FUNCTION = "luckDraw";
const COLLECTION_NAME = "luck-draws";
const db = wx.cloud.database();
const LATEST_LUCK_DRAW_COUNT = 1;
const LUCK_DRAW_HISTORY_COUNT = 10;

const preprocessLuckDraw = (luckDrawData) => {
  if (!luckDrawData) return null;

  const processOne = (item) => {
    const tickets =
      item.tickets?.map((ticket) => ({
        ...ticket,
        isWinner:
          item.winners?.some(
            (winner) => winner.userId === ticket.user._openid
          ) || false,
        user: {
          ...ticket.user,
          userId: ticket.user._openid,
        },
      })) || [];

    return {
      ...item,
      formattedDrawTime: item.drawnAt ? formatDate(item.drawnAt) : null,
      tickets,
      isOngoing: !item.winners || item.winners.length === 0,
      participants: tickets.map((ticket) => ({
        userId: ticket.user.userId,
        avatarUrl: ticket.user.avatarUrl,
      })),
    };
  };

  return Array.isArray(luckDrawData)
    ? luckDrawData.map(processOne)
    : processOne(luckDrawData);
};

export const fetchLuckDrawById = async (luckDrawId) => {
  return preprocessLuckDraw(
    await cloudCall(db.collection(COLLECTION_NAME).doc(luckDrawId).get())
  );
};

export const fetchLuckDraws = async (limit) => {
  return preprocessLuckDraw(
    await cloudCall(
      db
        .collection(COLLECTION_NAME)
        .orderBy("_createTime", "desc")
        .limit(limit)
        .get()
    )
  );
};

export const fetchLatestLuckDraw = async () => {
  return await fetchLuckDraws(LATEST_LUCK_DRAW_COUNT);
};

export const fetchLuckDrawHistory = async () => {
  return await fetchLuckDraws(LUCK_DRAW_HISTORY_COUNT);
};

export const createLuckDrawTicket = (luckDrawId) => {
  return cloudFunctionCall(CLOUD_FUNCTION_COLLECTION, "createTicket", {
    luckDrawId,
  });
};

export const draw = (luckDrawId) => {
  return cloudFunctionCall(LUCK_DRAW_CLOUD_FUNCTION, "draw", {
    luckDrawId,
  });
};
