const cloud = require("wx-server-sdk");

const TEMPLATE_ID = "wV8HUYugxQ3OI9MBkEPXMutZnOPHtQsu1tdMCoxOgi8";
const MINIPROGRAM_STATE = "trial";
const MAX_THING_LENGTH = 20;

const truncateString = (str) => {
  return str.slice(0, MAX_THING_LENGTH);
};

const NOTIFICATIONS = {
  winner: {
    message: "恭喜您中奖啦！",
    endMessage: "中奖用户请联系 zhiye 领取奖品",
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
        thing1: { value: truncateString(title) },
        thing3: { value: truncateString(template.message) },
        thing8: { value: truncateString(template.endMessage) },
      },
    });
  } catch (error) {
    console.error(`[Notification] Send failed (userId: ${userId}):`, error);
  }
};

module.exports = {
  sendNotification,
  NOTIFICATIONS,
};
