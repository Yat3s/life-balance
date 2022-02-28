
import {
  cloudCall,
  cloudFunctionCall
} from "./baseRepo";

const app = getApp();
const db = wx.cloud.database();
const _ = db.command;

const COLLECTION_NAME = 'carpools';
const CLOUD_FUNCTION_NAME = 'carpoolFunctions';

const preProcessStartDate = (data) => {
  for (const carpool of data) {
    processCarpool(carpool);
  }

  data.sort((a, b) => {
    if (a.isExpired && !b.isExpired) {
      return 1;
    }
    if (!a.isExpired && b.isExpired) {
      return -1;
    }

    if (a.isFull && !b.isFull) {
      return 1;
    }
    if (!a.isFull && b.isFull) {
      return -1;
    }

    return a.startDate - b.startDate;
  })
}

export function processCarpool(carpool) {
  carpool.startDateStr = (new Date(carpool.startDate)).dateStr();
  carpool.startTimeStr = (new Date(carpool.startDate)).hhmm();
  carpool.isExpired = Date.now() > carpool.startDate;
  carpool.isFull = carpool.hostType === 'driver' ? carpool.seatCount <= carpool.participants.length : carpool.participants.length > 0;
}

function collectionCall() {
  return db.collection(COLLECTION_NAME);
}

export function fetchCarpool(carpoolId) {
  return new Promise((resolve, reject) => {
    cloudCall(collectionCall().doc(carpoolId).get(), "fetchCarpool").then(carpool => {
      processCarpool(carpool);
      resolve(carpool);
    }).catch(err => {
      reject(err);
    })
  })
}


export function joinCarpool(carpoolId, user) {
  const data = {
    id: carpoolId,
    user
  }
  return cloudFunctionCall(CLOUD_FUNCTION_NAME, 'joinCarpool', data);
}

export function postCarpoolRequest(carpool) {
  return cloudCall(collectionCall().add({
    data: carpool
  }), "postCarpoolRequest")
}

export function fetchAllCarpools() {
  return cloudFunctionCall(CLOUD_FUNCTION_NAME, "fetchAllCarpools", null, preProcessStartDate);
}

export function fetchAllPersonalCarpools() {
  return cloudFunctionCall(CLOUD_FUNCTION_NAME, "fetchAllPersonalCarpools", null, preProcessStartDate);
}
