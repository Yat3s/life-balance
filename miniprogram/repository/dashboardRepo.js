import {
  fetchAllPublishedActivities
} from './activityRepo';

const {
  cloudCall,
  cloudFunctionCall
} = require('./baseRepo');
const FUNCTION_NAME = "dashboardFunctions"
const COLLECTION_NAME_BUILDING2 = "building2"
const COLLECTION_NAME_FOOD_MENU_B25 = "foodmenu"
const COLLECTION_NAME_FOOD_MENU_ZM = "foodmenu-zhongmeng"
const COLLECTION_NAME_WECHAT_GROUPS = "wechatgroups";
const COLLECTION_NAME_FAQ = "faq";

const db = wx.cloud.database();
const _ = db.command

const preProcessWechatGroups = (groups) => {
  groups.sort((a, b) => {

    if (a.index && b.index) {
      return a.index - b.index;
    } else if (a.index) {
      return -1;
    } else if (b.index) {
      return 1;
    } else {
      const participantCountA = a.participants ? a.participants.length : 0
      const participantCountB = b.participants ? b.participants.length : 0

      return participantCountB - participantCountA;
    }
  });
  for (const group of groups) {
    let tagStr = "";
    if (group.citys) {
      tagStr += group.citys.join(" / ");
    }
    if (group.tags) {
      if (tagStr) {
        tagStr += " / ";
      }
      tagStr += group.tags.join(" / ")
    }
    group.tagStr = tagStr;
    group.cityStr = group.citys ? group.citys.join('/') : '';
  }
}

const preProcessFaq = (qas) => {
  for (const qa of qas) {
    processQa(qa);
  }
}

function processQa(qa) {
  qa.siteStr = qa.sites.join("/");
}

const preProcessMenuData = (menus) => {
  if (!menus || menus.length == 0) {
    return;
  }

  for (const menu of menus) {
    menu.startDateStr = (new Date(menu.startDate)).mmdd();
    menu.endDateStr = (new Date(menu.endDate)).mmdd();

    // if (menu.menuContent) {
    //   menu.menuContent = menu.menuContent.replace(/\<img/gi, '<img style="max-width:100% !important; width: 100% !important; height:auto !important" ')
    // }
  }

  menus.sort((a, b) => {
    return a.date - b.date;
  })
}

export function fetchParkingSpace() {
  return cloudFunctionCall(FUNCTION_NAME, 'fetchParkingSpace');
}

export function fetchStockData() {
  return cloudFunctionCall(FUNCTION_NAME, 'fetchStockData');
}

export function fetchWechatGroups() {
  return cloudFunctionCall(FUNCTION_NAME, 'fetchWechatGroups', null, preProcessWechatGroups);
}

export function fetchWechatGroupCount() {
  return db.collection(COLLECTION_NAME_WECHAT_GROUPS).count();
}

export function fetchFaq() {
  return cloudFunctionCall(FUNCTION_NAME, 'fetchFaq', null, preProcessFaq);
}

export function fetchFaqCount() {
  return db.collection(COLLECTION_NAME_FAQ).count();
}

export function fetchFaqItem(id) {
  const data = {
    id
  }
  cloudFunctionCall(FUNCTION_NAME, 'faqPv', data);
  return cloudCall(db.collection(COLLECTION_NAME_FAQ).doc(id).get(), "fetchFaqItem", processQa);
}

export function fetchBuilding2Progress() {
  return cloudCall(db.collection(COLLECTION_NAME_BUILDING2).orderBy('_createTime', 'desc').get(), "fetchBuilding2Progress");
}

export function fetchFoodMenus(site = 'b25') {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  switch (site) {
    case 'b25': {
      return cloudCall(db.collection(COLLECTION_NAME_FOOD_MENU_B25).where({
        endDate: _.gte(today.getTime())
      }).get(), "fetchFoodMenusB25", preProcessMenuData);
    }

    case 'zhongmeng': {
      return cloudCall(db.collection(COLLECTION_NAME_FOOD_MENU_ZM).where({
        endDate: _.gte(today.getTime())
      }).get(), "fetchFoodMenusZhongmeng", preProcessMenuData);
    }
  }

  return null;
}

export function fetchTheMostPopularActivity() {
  return new Promise((resolve, reject) => {
    fetchAllPublishedActivities().then(activities => {

      const activeActivities = [];
      for (const activity of activities) {
        if (activity.endDate >= Date.now()) {
          activeActivities.push(activity);
        }
      }

      const compare = (a, b) => {
        const priorityA = a.priority || 0;
        const priorityB = b.priority || 0;

        if (priorityA || priorityB) {
          return priorityB - priorityA;
        }

        const participantA = a.participants ? a.participants.length : 0;
        const participantB = b.participants ? b.participants.length : 0;
        return participantB - participantA;
      }

      if (activeActivities.length > 0) {
        activeActivities.sort(compare);
        resolve(activeActivities[0]);
      } else {
        activities.sort(compare);
        resolve(activities[0]);
      }

    }).catch(err => {
      reject(err);
    })
  });
}

export function fetchWeworkParkingBooking() {
  return cloudFunctionCall(FUNCTION_NAME, 'fetchWeworkParkingBooking');
}

export function signupWeworkParkingBooking(id, user) {
  const data = {
    id,
    user,
  }
  return cloudFunctionCall(FUNCTION_NAME, 'signupWeworkParkingBooking', data);

}

export function cancelWeworkParkingBooking(id) {
  const data = {
    id
  }
  return cloudFunctionCall(FUNCTION_NAME, 'cancelWeworkParkingBooking', data);
}

export function fetchBanners() {
  return cloudCall(db.collection("banners").where({
    expireDate: _.gte(Date.now())
  }).get(), "fetchBanners");
}

export function fetchCanteenStatus() {
  return cloudFunctionCall(FUNCTION_NAME, 'fetchCanteenStatus');
}

export function fetchParkingSpacePrediction() {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  oneWeekAgo.setHours(0, 0, 0, 0);
  const oneWeekAgoTimestamp = oneWeekAgo.getTime();

  return new Promise((reslove, reject) => {
    cloudCall(db.collection("parking-full").where({
      date: _.gte(oneWeekAgoTimestamp)
    }).get(), "fetchParkingSpacePrediction").then(res => {
      if (!res || res.length == 0) {
        reslove(null);
      }

      console.log("fetchParkingSpacePrediction", res);

      let dayCount = 0;
      let theDayFullOneWeekAgo = res[0].full;
      if (theDayFullOneWeekAgo) {
        const date = new Date(theDayFullOneWeekAgo);
        date.setFullYear(now.getFullYear());
        date.setMonth(now.getMonth());
        date.setDate(now.getDate());

        theDayFullOneWeekAgo = date.getTime();
        dayCount ++;
      } else {
        theDayFullOneWeekAgo = 0;
      }

      // Find a record before today
      let theDayFullBeforeToday = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      for (let i = res.length - 1; i >= 0; i--) {
        const parkingFull = res[i];
        if (parkingFull.date < today.getTime() && parkingFull.full) {
          const date = new Date(parkingFull.full);
          date.setFullYear(now.getFullYear());
          date.setMonth(now.getMonth());
          date.setDate(now.getDate());

          theDayFullBeforeToday = date.getTime();
          dayCount ++;
          break;
        }
      }

      if (dayCount == 0) {
        reslove(null);
      }

      console.log("fetchParkingSpacePrediction test", `${dayCount}, ${(new Date(theDayFullOneWeekAgo)).toISOString()}, ${(new Date(theDayFullBeforeToday)).toISOString()}`);

      const predictionTime = (theDayFullOneWeekAgo + theDayFullBeforeToday) / dayCount;
      reslove(predictionTime);
    });
  });
}

export function recordParkingFull(full = null, left20 = null, left10 = null) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = today.getTime();
  cloudCall(db.collection("parking-full").where({
    date: todayTimestamp
  }).get(), "FetchTodayParkingFull").then(res => {
    console.log("FetchTodayParkingFull", res);
    if (res == null || res.length == 0) {
      // Create a record
      cloudCall(db.collection("parking-full").add({
        data: {
          date: todayTimestamp,
          full,
          left_10: left10,
          left_20: left20,
        }
      }), "RecordTodayParkingFull")
    } else {
      const parkingFull = res[0];
      const data = {};
      if (!parkingFull.left_10 && left10) {
        data.left_10 = left10;
      }
      if (!parkingFull.left_20 && left20) {
        data.left_20 = left20;
      }
      if (!parkingFull.full && full) {
        data.full = full;
      }

      if (isObjectEmpty(data)) {
        return;
      }

      cloudCall(db.collection("parking-full").doc(parkingFull._id).update({
        data
      }), "UpdateTodayParkingFull")
    }
  })
}

function isObjectEmpty(obj) {
  for (var prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      return false;
    }
  }
  return true;
}