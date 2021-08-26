const app = getApp();
const db = wx.cloud.database();
const _ = db.command;

const ACTIVITY_FUNCTION_NAME = 'activityFunctions';
const COLLECTION_ACTIVITY_CATEGORY = 'activity-categories';
const COLLECTION_ACTIVITY = 'activities';
const ACTIVITIES_DATA_TYPE_PUBLISHED = 'published';
const ACTIVITIES_DATA_TYPE_PERSONAL = 'personal';

const util = require('../common/util');

const preProcessStartDate = (data) => {
  for (const activity of data) {
    activity.startDateStr = util.formatDate(activity.startDate);
  }
}

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
function baseActivityCloudFuctionCall(action, data, preProcess = null) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: ACTIVITY_FUNCTION_NAME,
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

function fetchAllActivityCategories() {
  return baseCollectionRequestWrapper(db.collection(COLLECTION_ACTIVITY_CATEGORY).orderBy('priority', 'desc').get(), "fetchAllActivityCategories");
}

function fetchCategory(categoryId) {
  return baseCollectionRequestWrapper(db.collection(COLLECTION_ACTIVITY_CATEGORY).doc(categoryId).get(), "fetchCategory")
}

// Activity
function fetchAllActivities(type) {
  const data = {
    type
  }
  return baseActivityCloudFuctionCall('fetchAllActivities', data, preProcessStartDate);
}

function fetchAllPublishedActivities() {
  return fetchAllActivities(ACTIVITIES_DATA_TYPE_PUBLISHED);
}

function fetchAllPersonalActivities() {
  return fetchAllActivities(ACTIVITIES_DATA_TYPE_PERSONAL);
}

function fetchActivitiesByIds(ids) {
  const data = {
    ids
  }
  return baseActivityCloudFuctionCall('fetchActivitiesByIds', data, preProcessStartDate);
}

function fetchActivityItem(id) {
  const preProcess = (activity) => {
    activity.createDateStr = util.formatDate(activity._createTime);
    activity.startDateStr = util.formatDate(activity.startDate);
    activity.endDateStr = util.formatDate(activity.endDate);
  }
  return baseCollectionRequestWrapper(db.collection(COLLECTION_ACTIVITY).doc(id).get(), "fetchActivityItem", preProcess);
}

function draftActivity(activity) {
  return baseCollectionRequestWrapper(db.collection(COLLECTION_ACTIVITY).add({
    data: activity
  }), "draftActivity")
}

function updateActivity(activityId, activityBody) {
  const data = {
    id: activityId,
    activityBody
  }
  return baseActivityCloudFuctionCall('updateActivity', data);
}

function deleteActivity(activityId) {
  return baseCollectionRequestWrapper(db.collection(COLLECTION_ACTIVITY).doc(activityId).remove(), 'deleteActivity');
}

function signupActivity(activityId, user) {
  const data = {
    id: activityId,
    user
  }
  return baseActivityCloudFuctionCall('signupActivity', data);
}

function quitActivity(activityId) {
  const data = {
    id: activityId,
  }

  return baseActivityCloudFuctionCall('quitActivity', data);
}

module.exports = {
  fetchAllActivityCategories,
  fetchCategory,

  fetchAllActivities,
  fetchActivitiesByIds,
  fetchAllPublishedActivities,
  fetchAllPersonalActivities,
  fetchActivityItem,
  draftActivity,
  signupActivity,
  updateActivity,
  quitActivity,
  deleteActivity,
};