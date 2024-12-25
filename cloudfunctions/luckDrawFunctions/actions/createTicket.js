const cloud = require("wx-server-sdk");
const crypto = require("crypto");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

const COLLECTION = {
  LUCK_DRAWS: "luck-draws",
  USERS: "users",
};

const TICKET = {
  MAX_PER_USER: 3,
  LENGTH: 6,
  CHARS: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ",
};

/**
 * Generate unique ticket code using timestamp and random chars
 */
function generateTicketCode() {
  // Use first 3 chars from timestamp (base36) for uniqueness
  const timestamp = Date.now().toString(36).slice(-3).toUpperCase();

  // Use crypto for remaining 3 random chars
  const buffer = crypto.randomBytes(3);
  const randomChars = Array.from(buffer)
    .map((byte) => TICKET.CHARS[byte % TICKET.CHARS.length])
    .join("");

  return `${timestamp}${randomChars}`;
}

exports.main = async (props, context) => {
  const userId = cloud.getWXContext().OPENID;

  try {
    // Get luck draw and user info
    const [luckDraw, userResult] = await Promise.all([
      db.collection(COLLECTION.LUCK_DRAWS).doc(props.luckDrawId).get(),
      db.collection(COLLECTION.USERS).where({ _openid: userId }).get(),
    ]);

    const tickets = luckDraw.data.tickets || [];
    const userTickets = tickets.filter((t) => t.userId === userId);
    const userInfo = userResult.data[0];

    // Validate
    if (userTickets.length >= TICKET.MAX_PER_USER) {
      return {
        success: false,
        message: `Maximum limit of ${TICKET.MAX_PER_USER} tickets reached`,
      };
    }

    if (!userInfo) {
      return { success: false, message: "User not found" };
    }

    // Create new ticket with unique code
    const newTicket = {
      userId,
      code: generateTicketCode(),
      user: {
        _id: userInfo._id,
        _openid: userInfo._openid,
        avatarUrl: userInfo.avatarUrl,
        nickName: userInfo.nickName,
        ...(userInfo.company ? { company: userInfo.company } : {}),
      },
      createdAt: Date.now(),
    };

    // Update using atomic operation
    await db
      .collection(COLLECTION.LUCK_DRAWS)
      .doc(props.luckDrawId)
      .update({
        data: {
          tickets: _.push([newTicket]),
        },
      });

    return {
      success: true,
      data: {
        ticket: newTicket,
      },
      message: "抽奖码获取成功！",
    };
  } catch (error) {
    console.error("Create ticket error:", error);
    return {
      success: false,
      error: error.message || "Unknown error",
      message: "获取抽奖码失败",
    };
  }
};
