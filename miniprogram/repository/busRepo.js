import {
  cloudCall,
  cloudFunctionCall
} from "./baseRepo";

const CLOUD_FUNCTION_NAME = 'busFunctions';
const CACHE = 'busCaches';
const EXPIRE_DAYS = 3

const db = wx.cloud.database();

export function fetchGpsLocation(routeId) {
  return cloudFunctionCall(CLOUD_FUNCTION_NAME, 'fetchGpsLocation', {
    routeId
  });
}

export function fetchAllRoutes(siteId) {
  return new Promise((resolve, reject) => {
    cloudCall(db.collection(CACHE).where({
      expireAt: db.command.gt(Date.now())
    }).get()).then(caches => {
    
      if(caches && caches.length > 0) {
        resolve(caches[0].routes)
      } else {
        cloudFunctionCall(CLOUD_FUNCTION_NAME, 'fetchAllRoutes', {
          siteId
        }).then(res => {
          db.collection(CACHE).add({
            data: {
              routes: res,
              expireAt: Date.now() + 1000 * 60 * 60 * 24 * EXPIRE_DAYS
            }
          });
          resolve(res);
        }).catch(err => {
          reject(err);
        })
      }
    }).catch(err => {
      reject(err);
    })
  });
}