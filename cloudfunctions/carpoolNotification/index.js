const cloud = require('wx-server-sdk')
const TEMPLATE_ID = 'fXhHAyerNncJPt14XOTJJiRvjflfWw7Y3yGuR_gEPvw';

Date.prototype.yyyymmdd = function () {
  var mm = this.getMonth() + 1; // getMonth() is zero-based
  var dd = this.getDate();

  return [this.getFullYear(),
    (mm > 9 ? '' : '0') + mm,
    (dd > 9 ? '' : '0') + dd
  ].join('-');
};

Date.prototype.hhmm = function () {
  var hh = this.getHours();
  var mm = this.getMinutes();

  return [
    (hh > 9 ? '' : '0') + hh,
    (mm > 9 ? '' : '0') + mm
  ].join(':');
};

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
})
exports.main = async (event, context) => {
  const toUser = event.toUser;
  const carpool = event.carpool;

  const dateStr = new Date(carpool.startDate).yyyymmdd() + " " + new Date(carpool.startDate).hhmm();
  const address = carpool.locationFrom.name.substring(0, 20);
  try {
    const result = await cloud.openapi.subscribeMessage.send({
        "touser": toUser,
        "page": '/pages/index/index',
        "data": {
          "thing1": {
            "value": '有人申请和你一起拼车'
          },
          "time2": {
            "value": dateStr
          },
          "thing3": {
            "value": address
          },
          "thing5": {
            "value": 'Carpool'
          }
        },
        "templateId": TEMPLATE_ID,
        // "miniprogramState": 'developer'
      })
    return result
  } catch (err) {
    return err
  }
}