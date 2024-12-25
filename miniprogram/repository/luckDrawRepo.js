import { formatDate } from "../lib/utils";
import { cloudCall, cloudFunctionCall } from "./baseRepo";

const CLOUD_FUNCTION_COLLECTION = "luckDrawFunctions";
const LUCK_DRAW_CLOUD_FUNCTION = "luckDraw";
const COLLECTION_NAME = "luck-draws";
const db = wx.cloud.database();
const LATEST_LUCK_DRAW_COUNT = 1;
const LUCK_DRAW_HISTORY_COUNT = 10;
const MAX_TICKETS_PER_USER = 3;

const preprocessLuckDraw = (luckDrawData) => {
  if (!luckDrawData) return null;

  const userId = getApp()?.globalData?.userInfo?._openid;

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

    const uniqueParticipants = new Map();
    tickets.forEach((ticket) => {
      if (!uniqueParticipants.has(ticket.user.userId)) {
        uniqueParticipants.set(ticket.user.userId, {
          _id: ticket.user._id,
          userId: ticket.user.userId,
          avatarUrl: ticket.user.avatarUrl,
          nickName: ticket.user.nickName,
        });
      }
    });

    let processedData = {
      ...item,
      formattedDrawTime: item.drawnAt ? formatDate(item.drawnAt) : null,
      tickets,
      isOngoing: !item.winners || item.winners.length === 0,
      participants: Array.from(uniqueParticipants.values()),
    };

    if (userId) {
      const userTickets = tickets.filter((ticket) => ticket.userId === userId);
      const remainingChances = Math.max(
        MAX_TICKETS_PER_USER - userTickets.length,
        0
      );

      const totalTickets = tickets.length;
      const winnerCount =
        item.prizeTiers?.reduce((sum, tier) => sum + tier.count, 0) || 0;

      const userWinRate =
        totalTickets > 0 && userTickets.length > 0
          ? ((userTickets.length / totalTickets) * winnerCount * 100).toFixed(1)
          : 0;

      processedData = {
        ...processedData,
        userTickets,
        remainingChances,
        userWinRate,
        hasParticipated: userTickets.length > 0,
      };
    }

    return processedData;
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
