import { navigateToOnboarding } from "../pages/router";
import { cloudFunctionCall } from "./baseRepo";

const app = getApp();
const db = wx.cloud.database();
const _ = db.command;

const COLLECTION_USERS = "users";
const COLLECTION_COMPANIES = "companies";
const USER_FUNCTION_NAME = "userFunctions";

// Collections call
export function baseCollectionRequestWrapper(
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

// Cloud functions call
export function baseUserCloudFunctionCall(action, data, preProcess = null) {
  return new Promise((resolve, reject) => {
    wx.cloud
      .callFunction({
        name: USER_FUNCTION_NAME,
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

export function likeActivity(activityId) {
  return new Promise((resolve, reject) => {
    this.fetchUserInfoOrSignup().then((userInfo) => {
      baseCollectionRequestWrapper(
        db
          .collection(COLLECTION_USERS)
          .doc(userInfo._id)
          .update({
            data: {
              likes: _.push(activityId),
            },
          })
      )
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  });
}

export function unlikeActivity(activityId) {
  return new Promise((resolve, reject) => {
    this.fetchUserInfoOrSignup().then((userInfo) => {
      baseCollectionRequestWrapper(
        db
          .collection(COLLECTION_USERS)
          .doc(userInfo._id)
          .update({
            data: {
              likes: _.pull(activityId),
            },
          })
      )
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  });
}

export function fetchUserInfo() {
  const call = baseCollectionRequestWrapper(
    db.collection(COLLECTION_USERS).get(),
    "fetchUserInfo"
  );
  return new Promise((resolve, reject) => {
    call
      .then((data) => {
        if (data && data.length > 0) {
          resolve(data[0]);
          app.globalData.userInfo = data[0];
        } else {
          resolve(null);
        }
      })
      .catch((err) => {
        reject(`fetchUserInfo failure: ${err}`);
      });
  });
}

export function signup(user) {
  return new Promise((resolve, reject) => {
    fetchUserInfo()
      .then((userInfo) => {
        if (userInfo) {
          resolve(userInfo._id);
        } else {
          user.updatedAt = Date.now();
          db.collection(COLLECTION_USERS)
            .add({
              data: user,
            })
            .then((res) => {
              resolve(res._id);
            });
        }
      })
      .catch((err) => {
        reject(err);
      });
  });
}

export function fetchUserInfoOrSignup() {
  return new Promise((resolve, reject) => {
    const cachedUser = app.globalData.userInfo;
    if (cachedUser) {
      resolve(cachedUser);
    } else {
      fetchUserInfo()
        .then((user) => {
          if (user) {
            resolve(user);
          } else {
            navigateToOnboarding();
          }
        })
        .catch((err) => {
          reject(err);
        });
    }
  });
}

export function updateUserInfo(id, userInfo) {
  return baseCollectionRequestWrapper(
    db
      .collection(COLLECTION_USERS)
      .doc(id)
      .update({
        data: { ...userInfo, updatedAt: Date.now() },
      }),
    "updateUserInfo"
  );
}

export function updatePhoneNumber(userId, phoneNumberCloudId) {
  return wx.cloud.callFunction({
    name: "updatePhoneNumber",
    data: {
      id: userId,
      phoneNumberData: wx.cloud.CloudID(phoneNumberCloudId),
    },
  });
}

export function fetchUserProfile(id) {
  const data = {
    id,
  };

  return cloudFunctionCall(USER_FUNCTION_NAME, "fetchUserProfile", data);
}

export function fetchPendingAuthUsers() {
  return cloudFunctionCall(USER_FUNCTION_NAME, "fetchPendingAuthUsers", {});
}

export function createEnterpriseAuth(enterpriseAuthInfo) {
  return cloudFunctionCall(USER_FUNCTION_NAME, "createEnterpriseAuth", {
    enterpriseAuthInfo,
  });
}

export function updateEnterpriseAuth(authRequestIds) {
  return cloudFunctionCall(USER_FUNCTION_NAME, "updateEnterpriseAuth", {
    authRequestIds,
  });
}

export function fetchCompanies() {
  return baseCollectionRequestWrapper(
    db.collection(COLLECTION_COMPANIES).get(),
    "fetchCompanies"
  );
}

export function fetchCompany(id) {
  return baseCollectionRequestWrapper(
    db.collection(COLLECTION_COMPANIES).doc(id).get(),
    "fetchCompany"
  );
}

export function uploadFiles(filePaths, folder) {
  console.log(filePaths);
  let tasks = [];
  for (const path of filePaths) {
    console.log(path);
    const random = Date.now() + "-" + Math.random();
    const cloudPath = `${folder}/photo-${random}.png`;
    console.log(cloudPath);
    tasks.push(
      new Promise((resolve, reject) => {
        wx.cloud
          .uploadFile({
            cloudPath,
            filePath: path,
          })
          .then((file) => {
            resolve(file.fileID);
          });
      })
    );
  }

  return Promise.all(tasks);
}
