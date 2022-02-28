// Collections call
const db = wx.cloud.database();

export function cloudCall(promiseCall, tag = "Database call", preProcess = null) {
  return new Promise((resolve, reject) => {
    promiseCall.then(res => {
      const result = res.data;
      if (preProcess) {
        preProcess(result);
      }
      resolve(result);
    }).catch(err => {
      reject(`${tag} failure: ${err}`);
    })
  });
}

export function cloudFunctionCall(functionName, action, data = null, preProcess = null) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: functionName,
      data: {
        action,
        data
      }
    }).then(res => {
      const result = res.result;
      if (preProcess) {
        preProcess(result);
      }
      resolve(result);
    }).catch(err => {
      console.error(action, err);
      reject(`${action} failure: ${err}`);
    })
  });
}

export function getAppConfig() {
  return new Promise((resolve, reject) => {
    cloudCall(db.collection("appconfig").get()).then(configs => {
      resolve(configs[0]);
    })
  })
}