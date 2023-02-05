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
      const participantCountA = a.participants ?  a.participants.length : 0
      const participantCountB = b.participants ?  b.participants.length : 0
      
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

  switch(site) {
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
  return cloudFunctionCall(FUNCTION_NAME, 'fetchParkingSpacePrediction');
}