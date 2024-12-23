const db = wx.cloud.database();
const APP_CONFIG_ID = "9e7190f1617386da018b7e187747d1b3";
const COLLECTION_NAME = "appconfig";

export function cloudCall(
  promiseCall,
  tag = "Database call",
  preProcess = null
) {
  return new Promise((resolve, reject) => {
    promiseCall
      .then((res) => {
        const result = res.data;
        if (preProcess) {
          preProcess(result);
        }
        resolve(result);
      })
      .catch((err) => {
        reject(`${tag} failure: ${err}`);
      });
  });
}

export function cloudFunctionCall(
  functionName,
  action,
  data = null,
  preProcess = null
) {
  return new Promise((resolve, reject) => {
    wx.cloud
      .callFunction({
        name: functionName,
        data: {
          action,
          data,
        },
      })
      .then((res) => {
        const result = res.result;
        if (preProcess) {
          preProcess(result);
        }
        resolve(result);
      })
      .catch((err) => {
        console.error(action, err);
        reject(`${action} failure: ${err}`);
      });
  });
}

export function getAppConfig() {
  return new Promise((resolve, reject) => {
    cloudCall(db.collection(COLLECTION_NAME).doc(APP_CONFIG_ID).get())
      .then((config) => {
        resolve(config);
      })
      .catch((error) => {
        reject(error);
      });
  });
}
