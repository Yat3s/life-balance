const app = getApp();
const db = wx.cloud.database();
const _ = db.command;

const ACTIVITY_FUNCTION_NAME = 'activityFunctions';
const COLLECTION_ACTIVITY_CATEGORY = 'activity-categories';
const COLLECTION_ACTIVITY = 'activities';
const ACTIVITIES_DATA_TYPE_PUBLISHED = 'published';
const ACTIVITIES_DATA_TYPE_PERSONAL = 'personal';

const util = require('../common/util');
const { cloudCall, cloudFunctionCall } = require('./baseRepo');

const preProcessStartDate = (data) => {
  for (const activity of data) {
    activity.startDateStr = util.formatDate(activity.startDate);
  }
}

function fetchAllActivityCategories() {
  return cloudCall(db.collection(COLLECTION_ACTIVITY_CATEGORY).orderBy('priority', 'desc').get(), "fetchAllActivityCategories");
}

function fetchCategory(categoryId) {
  return cloudCall(db.collection(COLLECTION_ACTIVITY_CATEGORY).doc(categoryId).get(), "fetchCategory")
}

// Activity
function fetchAllActivities(type) {
  const data = {
    type
  }
  return cloudFunctionCall(ACTIVITY_FUNCTION_NAME, 'fetchAllActivities', data, preProcessStartDate);
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
  return cloudFunctionCall(ACTIVITY_FUNCTION_NAME, 'fetchActivitiesByIds', data, preProcessStartDate);
}

function fetchActivityItem(id) {
  const preProcess = (activity) => {
    activity.createDateStr = util.formatDate(activity._createTime);
    activity.startDateStr = util.formatDate(activity.startDate);
    activity.endDateStr = util.formatDate(activity.endDate);
  }
  return cloudCall(db.collection(COLLECTION_ACTIVITY).doc(id).get(), "fetchActivityItem", preProcess);
}

function draftActivity(activity) {
  return cloudCall(db.collection(COLLECTION_ACTIVITY).add({
    data: activity
  }), "draftActivity")
}

function updateActivity(activityId, activityBody) {
  const data = {
    id: activityId,
    activityBody
  }
  
  return cloudFunctionCall(ACTIVITY_FUNCTION_NAME, 'updateActivity', data);
}

function deleteActivity(activityId) {
  return cloudCall(db.collection(COLLECTION_ACTIVITY).doc(activityId).remove(), 'deleteActivity');
}

function signupActivity(activityId, user) {
  const data = {
    id: activityId,
    user
  }
  return cloudFunctionCall(ACTIVITY_FUNCTION_NAME, 'signupActivity', data);
}

function quitActivity(activityId) {
  const data = {
    id: activityId,
  }

  return cloudFunctionCall(ACTIVITY_FUNCTION_NAME, 'quitActivity', data);
}

function fetchUserActivities(id) {
  const data = {
    id
  }
  return cloudFunctionCall(ACTIVITY_FUNCTION_NAME, 'fetchUserActivities', data, preProcessStartDate);
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
  fetchUserActivities
};