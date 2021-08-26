const app = getApp();
const db = wx.cloud.database();
const _ = db.command;

const COLLECTION_USER = 'users';
const util = require('../common/util');
const USER_FUNCTION_NAME = 'userFunctions';

// Collections call
function baseCollectionRequestWrapper(promiseCall, tag = "Database call", preProcess = null) {
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

// Cloud functions call
function baseUserCloudFuctionCall(action, data, preProcess = null) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: USER_FUNCTION_NAME,
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


function likeActivity(activityId) {
  return new Promise((resolve, reject) => {
    this.fetchUserInfoOrSignup().then(userInfo => {
      baseCollectionRequestWrapper(db.collection(COLLECTION_USER).doc(userInfo._id).update({
        data: {
          likes: _.push(activityId)
        }
      })).then(res => {
        resolve(res);
      }).catch(err => {
        reject(err);
      })
    })
  });
}


function unlikeActivity(activityId) {
  return new Promise((resolve, reject) => {
    this.fetchUserInfoOrSignup().then(userInfo => {
      baseCollectionRequestWrapper(db.collection(COLLECTION_USER).doc(userInfo._id).update({
        data: {
          likes: _.pull(activityId)
        }
      })).then(res => {
        resolve(res);
      }).catch(err => {
        reject(err);
      })
    })
  });
}

function fetchUserInfo() {
  const call = baseCollectionRequestWrapper(db.collection(COLLECTION_USER).get(), "fetchUserInfo")
  return new Promise((resolve, reject) => {
    call.then(data => {
      if (data && data.length > 0) {
        resolve(data[0]);
      } else {
        resolve(null);
      }
    }).catch(err => {
      reject(`fetchUserInfo failure: ${err}`);
    })
  });
}

function signup(user) {
  return new Promise((resolve, reject) => {
    fetchUserInfo().then(userInfo => {
      if (userInfo) {
        resolve(userInfo._id);
      } else {
        db.collection(COLLECTION_USER).add({
          data: user
        }).then(res => {
          resolve(res._id);
        })
      }
    })
  });
}

function fetchUserInfoOrSignup() {
  return new Promise((resolve, reject) => {
    if (app.globalData.userInfo) {
      this.fetchUserInfo().then(user => {
        if (user) {
          app.globalData.userInfo = user;
          resolve(user);
        } else {
          // This shouldn't happen
        }
      })
    } else {
      wx.getUserProfile({
        desc: '用于完善用户信息'
      }).then(res => {
        const newUserInfo = res.userInfo;
        if (newUserInfo) {
          signup(newUserInfo).then(id => {
            newUserInfo.id = id;
            app.globalData.userInfo = newUserInfo;
            resolve(newUserInfo);
          });
        } else {
          reject("Failed to get user profile.");
        }
      }).catch(err => {
        reject(err);
      })
    }
  });
}


function updateUserInfo(id, userInfo) {
  return baseCollectionRequestWrapper(db.collection(COLLECTION_USER).doc(id).update({
    data: userInfo
  }), "updateUserInfo");
}

function updatePhoneNumber(userId, phoneNumberCloudId) {
  return wx.cloud.callFunction({
    name: 'updatePhoneNumber',
    data: {
      id: userId,
      phoneNumberData: wx.cloud.CloudID(phoneNumberCloudId)
    }
  });
}

module.exports = {
  likeActivity,
  unlikeActivity,
  signup,
  fetchUserInfo,
  fetchUserInfoOrSignup,
  updateUserInfo,
  updatePhoneNumber
};