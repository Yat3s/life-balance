import { fetchAllPublishedActivities } from "./activityRepo";

const util = require("../common/util");
const { cloudCall, cloudFunctionCall } = require("./baseRepo");
const FUNCTION_NAME = "dashboardFunctions";
const COLLECTION_NAME_BUILDING2 = "building2";
const COLLECTION_NAME_FOOD_MENU_B25 = "foodmenu";
const COLLECTION_NAME_FOOD_MENU_ZM = "foodmenu-zhongmeng";
const COLLECTION_NAME_WECHAT_GROUPS = "wechatgroups";
const COLLECTION_ACTIVITY = "activities";
const COLLECTION_NAME_FAQ = "faq";
const COLLECTION_NAME_PARTNER_MERCHANTS = "partner-merchants";
const db = wx.cloud.database();
const _ = db.command;

const preProcessWechatGroups = (groups) => {
  groups.sort((a, b) => {
    return b._createTime - a._createTime;
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
      tagStr += group.tags.join(" / ");
    }
    group.tagStr = tagStr;
    group.cityStr = group.citys ? group.citys.join("/") : "";
  }
};

const preProcessFaq = (qas) => {
  for (const qa of qas) {
    processQa(qa);
  }
};

function processQa(qa) {
  qa.siteStr = qa.sites.join("/");
}

const preProcessMenuData = (menus) => {
  if (!menus || menus.length == 0) {
    return;
  }

  for (const menu of menus) {
    menu.startDateStr = new Date(menu.startDate).mmdd();
    menu.endDateStr = new Date(menu.endDate).mmdd();

    // if (menu.menuContent) {
    //   menu.menuContent = menu.menuContent.replace(/\<img/gi, '<img style="max-width:100% !important; width: 100% !important; height:auto !important" ')
    // }
  }

  menus.sort((a, b) => {
    return a.date - b.date;
  });
};

const preProcessStartDate = (data) => {
  for (const activity of data) {
    activity.startDateStr = util.formatDate(activity.startDate);
  }
};

export function fetchParkingSpace() {
  return cloudFunctionCall(FUNCTION_NAME, "fetchParkingSpace");
}

export function fetchStockData() {
  return cloudFunctionCall(FUNCTION_NAME, "fetchStockData");
}

export function fetchLatestWechatGroups() {
  return cloudCall(
    db
      .collection(COLLECTION_NAME_WECHAT_GROUPS)
      .where({
        code: _.neq(""),
      })
      .orderBy("_createTime", "desc")
      .limit(1)
      .get(),
    "fetchLatestWechatGroups",
    preProcessWechatGroups
  );
}

export function fetchWechatGroups() {
  return cloudFunctionCall(
    FUNCTION_NAME,
    "fetchWechatGroups",
    null,
    preProcessWechatGroups
  );
}

export function fetchUserWechatGroups(id) {
  const data = {
    id,
  };
  return cloudFunctionCall(
    FUNCTION_NAME,
    "fetchUserWechatGroups",
    data,
    preProcessWechatGroups
  );
}

export function fetchWechatGroupCount() {
  return db.collection(COLLECTION_NAME_WECHAT_GROUPS).count();
}

export function fetchUpcomingActivity() {
  return cloudCall(
    db
      .collection(COLLECTION_ACTIVITY)
      .where({
        endDate: _.gt(Date.now()),
      })
      .orderBy("endDate", "desc")
      .limit(1)
      .get(),
    "fetchLatestActivity",
    preProcessStartDate
  );
}

export function fetchLatestPartnerMerchant() {
  return cloudCall(
    db
      .collection(COLLECTION_NAME_PARTNER_MERCHANTS)
      .field({
        _id: true,
        name: true,
        logo: true,
      })
      .orderBy("_createTime", "desc")
      .limit(1)
      .get(),
    "fetchLatestPartnerMerchant"
  );
}

export function fetchFaq() {
  return cloudFunctionCall(FUNCTION_NAME, "fetchFaq", null, preProcessFaq);
}

export function fetchFaqCount() {
  return db.collection(COLLECTION_NAME_FAQ).count();
}

export function fetchFaqItem(id) {
  const data = {
    id,
  };
  cloudFunctionCall(FUNCTION_NAME, "faqPv", data);
  return cloudCall(
    db.collection(COLLECTION_NAME_FAQ).doc(id).get(),
    "fetchFaqItem",
    processQa
  );
}

export function fetchBuilding2Progress() {
  return cloudCall(
    db
      .collection(COLLECTION_NAME_BUILDING2)
      .orderBy("_createTime", "desc")
      .get(),
    "fetchBuilding2Progress"
  );
}

export function fetchFoodMenus(site = "b25") {
  const today = setTimeToZero(new Date());

  switch (site) {
    case "b25": {
      return cloudCall(
        db
          .collection(COLLECTION_NAME_FOOD_MENU_B25)
          .where({
            endDate: _.gte(today.getTime()),
          })
          .get(),
        "fetchFoodMenusB25",
        preProcessMenuData
      );
    }

    case "zhongmeng": {
      return cloudCall(
        db
          .collection(COLLECTION_NAME_FOOD_MENU_ZM)
          .where({
            endDate: _.gte(today.getTime()),
          })
          .get(),
        "fetchFoodMenusZhongmeng",
        preProcessMenuData
      );
    }
  }

  return null;
}

export function fetchTheMostPopularActivity() {
  return new Promise((resolve, reject) => {
    fetchAllPublishedActivities()
      .then((activities) => {
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
        };

        if (activeActivities.length > 0) {
          activeActivities.sort(compare);
          resolve(activeActivities[0]);
        } else {
          activities.sort(compare);
          resolve(activities[0]);
        }
      })
      .catch((err) => {
        reject(err);
      });
  });
}

export function fetchWeworkParkingBooking() {
  return cloudFunctionCall(FUNCTION_NAME, "fetchWeworkParkingBooking");
}

export function signupWeworkParkingBooking(id, user) {
  const data = {
    id,
    user,
  };
  return cloudFunctionCall(FUNCTION_NAME, "signupWeworkParkingBooking", data);
}

export function cancelWeworkParkingBooking(id) {
  const data = {
    id,
  };
  return cloudFunctionCall(FUNCTION_NAME, "cancelWeworkParkingBooking", data);
}

export function fetchBanners() {
  return cloudCall(
    db
      .collection("banners")
      .where({
        expireDate: _.gte(Date.now()),
      })
      .get(),
    "fetchBanners"
  );
}

export function fetchCanteenStatus() {
  return cloudFunctionCall(FUNCTION_NAME, "fetchCanteenStatus");
}

export function fetchParkingSpacePrediction() {
  const now = new Date();
  const oneWeekAgo = setTimeToZero(
    new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  );
  const oneWeekAgoTimestamp = oneWeekAgo.getTime();

  return new Promise((reslove, reject) => {
    cloudCall(
      db
        .collection("parking-full")
        .where({
          date: _.gte(oneWeekAgoTimestamp),
        })
        .get(),
      "fetchParkingSpacePrediction"
    ).then((res) => {
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
        dayCount++;
      } else {
        theDayFullOneWeekAgo = 0;
      }

      // Find a record before today
      let theDayFullBeforeToday = 0;
      const today = setTimeToZero(new Date());
      for (let i = res.length - 1; i >= 0; i--) {
        const parkingFull = res[i];
        if (parkingFull.date < today.getTime() && parkingFull.full) {
          const date = new Date(parkingFull.full);
          date.setFullYear(now.getFullYear());
          date.setMonth(now.getMonth());
          date.setDate(now.getDate());

          theDayFullBeforeToday = date.getTime();
          dayCount++;
          break;
        }
      }

      if (dayCount == 0) {
        reslove(null);
      }

      console.log(
        "fetchParkingSpacePrediction test",
        `${dayCount}, ${new Date(
          theDayFullOneWeekAgo
        ).toISOString()}, ${new Date(theDayFullBeforeToday).toISOString()}`
      );

      const predictionTime =
        (theDayFullOneWeekAgo + theDayFullBeforeToday) / dayCount;
      reslove(predictionTime);
    });
  });
}

export function fetchLastParkingFullTime() {
  const now = new Date();
  const isMonday = now.getDay() == 1;
  const lastParkingFullDate = setTimeToZero(
    new Date(
      now.getTime() - (isMonday ? 3 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000)
    )
  );

  return new Promise((resolve, reject) => {
    cloudCall(
      db
        .collection("parking-full")
        .where({
          date: _.gte(lastParkingFullDate.getTime()),
        })
        .get(),
      "fetchLastParkingFullTime"
    ).then((res) => {
      if (!res || res.length === 0) {
        resolve(null);
        return;
      }

      let lastParkingFull = res[0].full;
      resolve(lastParkingFull);
    });
  });
}

export function fetchLastWeekParkingFullTime() {
  const now = new Date();
  const lastWeekParkingFullDate = setTimeToZero(
    new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  );

  return new Promise((resolve, reject) => {
    cloudCall(
      db
        .collection("parking-full")
        .where({
          date: _.gte(lastWeekParkingFullDate.getTime()),
        })
        .get(),
      "fetchLastWeekParkingFullTime"
    ).then((res) => {
      if (!res || res.length === 0) {
        resolve(null);
        return;
      }

      let lastWeekParkingFull = res[0].full;
      const lastWeekParkingFullResDate = setTimeToZero(
        new Date(lastWeekParkingFull)
      );
      // if the last week parking full time is the same as the last week parking full date,
      // then return the last week parking full time
      if (
        lastWeekParkingFullResDate.getTime() ===
        lastWeekParkingFullDate.getTime()
      ) {
        resolve(lastWeekParkingFull);
      } else {
        resolve(null);
      }
    });
  });
}

export function recordParkingFull(full = null, left20 = null, left10 = null) {
  const today = setTimeToZero(new Date());
  const todayTimestamp = today.getTime();
  cloudCall(
    db
      .collection("parking-full")
      .where({
        date: todayTimestamp,
      })
      .get(),
    "FetchTodayParkingFull"
  ).then((res) => {
    console.log("FetchTodayParkingFull", res);
    if (res == null || res.length == 0) {
      // Create a record
      cloudCall(
        db.collection("parking-full").add({
          data: {
            date: todayTimestamp,
            full,
            left_10: left10,
            left_20: left20,
          },
        }),
        "RecordTodayParkingFull"
      );
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

      console.log("record", data + ", " + parkingFull._id);

      cloudFunctionCall(FUNCTION_NAME, "recordParkingFull", {
        id: parkingFull._id,
        data,
      });
    }
  });
}

function isObjectEmpty(obj) {
  for (var prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      return false;
    }
  }
  return true;
}

function setTimeToZero(date) {
  date.setHours(0, 0, 0, 0);
  return date;
}
