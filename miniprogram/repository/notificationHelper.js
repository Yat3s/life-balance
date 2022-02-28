
const TEMPLATE_ID_CARPOOL = 'fXhHAyerNncJPt14XOTJJiRvjflfWw7Y3yGuR_gEPvw';
const TEMPLATE_ID_ACTIVITY = 'JymnD7GytVnoaYmhA9lOEy3AyWibV1MzMNdjk-vD9kM';

export function subscribeCarpoolNotification() {
  subscribeNotification(TEMPLATE_ID_CARPOOL, 'Post success', 'Subscribe to get notification when someone apply?')
}

export function subscribeActivityNotification() {
  subscribeNotification(TEMPLATE_ID_ACTIVITY, 'Create success', 'Subscribe to get notification when someone join?')
}

export function notifyCarpoolHost(carpool) {
  wx.cloud.callFunction({
    name: 'carpoolNotification',
    data: {
      toUser: carpool.host._openid,
      carpool
    }
  }).then(res => {
    console.log(res);
  }).catch(err => {
    console.log(err);
  });
}

export function notifyActivityHost(activity) {
  wx.cloud.callFunction({
    name: 'activityNotification',
    data: {
      toUser: activity.organizer._openid,
      activity
    }
  }).then(res => {
    console.log(res);
  }).catch(err => {
    console.log(err);
  });
}


function subscribeNotification(tempId, title, content, navigateBack = true) {
  wx.showModal({
    title,
    content,
    success(res) {
      if (res.confirm) {
        wx.requestSubscribeMessage({
          tmplIds: [tempId],
          success(res) {
            if (navigateBack) {
              wx.navigateBack({
                delta: 1,
              })
            }
          },
          fail(err) {
            if (navigateBack) {
              wx.navigateBack({
                delta: 1,
              })
            }
          }
        })
      } else if (res.cancel) {
        if (navigateBack) {
          wx.navigateBack({
            delta: 1,
          })
        }
      }
    }
  })
}