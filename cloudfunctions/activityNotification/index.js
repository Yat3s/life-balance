const cloud = require("wx-server-sdk");
const TEMPLATE_ID = "JymnD7GytVnoaYmhA9lOEy3AyWibV1MzMNdjk-vD9kM";

Date.prototype.yyyymmdd = function () {
  var mm = this.getMonth() + 1; // getMonth() is zero-based
  var dd = this.getDate();

  return [
    this.getFullYear(),
    (mm > 9 ? "" : "0") + mm,
    (dd > 9 ? "" : "0") + dd,
  ].join("-");
};

Date.prototype.hhmm = function () {
  var hh = this.getHours();
  var mm = this.getMinutes();

  return [(hh > 9 ? "" : "0") + hh, (mm > 9 ? "" : "0") + mm].join(":");
};

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});
exports.main = async (event, context) => {
  const toUser = event.toUser;
  const activity = event.activity;

  const dateStr =
    new Date(activity.startDate).yyyymmdd() +
    " " +
    new Date(activity.startDate).hhmm();
  const address = activity.location.name.substring(0, 20);
  const title = activity.title.substring(0, 20);
  try {
    const result = await cloud.openapi.subscribeMessage.send({
      touser: toUser,
      page: `/pages/activity/activitydetail/activitydetail?id=${activity._id}`,
      data: {
        thing1: {
          value: title,
        },
        date2: {
          value: dateStr,
        },
        thing3: {
          value: address,
        },
        phrase4: {
          value: "新申请加入",
        },
      },
      templateId: TEMPLATE_ID,
      // "miniprogramState": 'developer'
    });
    return result;
  } catch (err) {
    return err;
  }
};
