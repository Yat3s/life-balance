// 云函数入口文件
const cloud = require('wx-server-sdk')
const rp = require('request-promise')
const APPID = 'wxc8745aa8f8c9a64e'
const APPSECRET = '34a3b015e8fcaa0fd1edeed21fff7805'
const TEMPLATE_ID = '9UbBuyHoTS8vX0UaIGqf2rAwcQS3kM1giOV9EPJp1O8'

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();

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

// 云函数入口函数
exports.main = async (event, context) => {
  if (event.collection != 'activities') {
    return null;
  }

  const payload = event.payload;
  const activityId = event.actionFilter._id;

  if (!payload.published) {
    return null;
  }

  const activity = (await db.collection('activities').doc(activityId).get()).data;
  var options = {
    uri: `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${APPID}&secret=${APPSECRET}`,
    json: true
  }
  const body = await rp.get(options)
  const token = body.access_token;

  const title = activity.title.substring(0, 20);
  const dateStr = new Date(activity.startDate).yyyymmdd() + " " + new Date(activity.startDate).hhmm();
  const location = activity.location.name.substring(0, 20);
  var options = {
    method: 'POST',
    uri: `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${token}`,
    body: {
      touser: activity.organizer._openid,
      template_id: TEMPLATE_ID,
      page: `/pages/activity/activitydetail/activitydetail?id=${activityId}`,
      lang: "zh_CN",
      data: {
        thing1: {
          value: title
        },
        thing2: {
          value: location
        },
        time3: {
          value: dateStr
        },
        thing5: {
          value: (activity.tags && activity.tags.length) ? activity.tags[0] : '活动'
        },
        thing4: {
          value: '活动审核通过，快邀请你的朋友一起加入吧！'
        }
      }

    },
    json: true
  };

  rp(options)
    .then(function (parsedBody) {
      console.log(parsedBody);
      // POST succeeded...
    })
    .catch(function (err) {
      // POST failed...
      console.log("error", err);
    });


  return null;
}