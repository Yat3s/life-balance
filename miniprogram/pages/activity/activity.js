import QQMapWX from '../../common/qqmap-wx-jssdk.min.js';

const activityRepo = require('../../repository/activityRepo');
const userRepo = require('../../repository/userRepo');
const router = require('../router');
const util = require('../../common/util');
const pref = require('../../common/preference');
const app = getApp();

const NEARBY_RANGE = 200; // km

const CATEGORY_ALL = {
  _id: 'all',
  name: 'All'
};

Component({
  options: {
    addGlobalClass: true
  },

  data: {
    toolbarHeight: app.globalData.toolbarHeight,
    avatarMarginRight: app.globalData.menu.width,

    selectedCategory: CATEGORY_ALL,

    selectedActivityFilterId: 'popular',

    activityFilters: [{
        id: 'popular',
        name: 'Active',
      },
      {
        id: 'end',
        name: 'Ended',
      },
    ],

    categoryBgAccessories: [{
        bgColor: "#FE7748",
        iconRes: "ic_accessory1.png",
        css: "left: 40%; top: 0; width: 60rpx;",
        imgMode: "widthFix",
      },
      {
        bgColor: "#182B89",
        iconRes: "ic_accessory2.png",
        css: "left: 0; top: 10%; height: 40rpx;",
        imgMode: "heightFix",
      },
      {
        bgColor: "#8F97FD",
        iconRes: "ic_accessory3.png",
        css: "right: 5%; top: 5%; height: 80rpx;",
        imgMode: "heightFix",
      },
      {
        bgColor: "#FFC478",
        iconRes: "ic_accessory4.png",
        css: "bottom: 0; right: 20%; height: 30rpx;",
        imgMode: "heightFix",
      }
    ]
  },

  pageLifetimes: {
    show() {
      // Refresh data

      if (this.data.categories) {
        this.fetchActivityCategories();
        this.requestLocation();
      }
    }
  },

  methods: {

    onSelectFilter(e) {
      const selectedActivityFilterId = e.currentTarget.dataset.id;

      this.setData({
        selectedActivityFilterId
      }, this.checkContentEmpty);

      this.sortActivityByFilter(selectedActivityFilterId);
    },

    isNearby(activity) {
      const distance = activity.distance || activity.distanceFromOrganizer || 100000;
      return distance < NEARBY_RANGE;
    },

    sortActivityByFilter(filterId) {
      const {
        activities
      } = this.data;

      let compare = null;
      const now = Date.now();

      switch (filterId) {
        case 'popular':
          compare = (a, b) => {
            const isNearbyA = this.isNearby(a);
            const isNearbyB = this.isNearby(b);
            if (isNearbyA && !isNearbyB) {
              return -1;
            }
            if (!isNearbyA && isNearbyB) {
              return 1;
            }
            if (!isNearbyA && !isNearbyB) {
              const distanceA = a.distance || a.distanceFromOrganizer || 100000;
              const distanceB = b.distance || b.distanceFromOrganizer || 100000;
              return distanceA - distanceB;
            }

            const priorityA = a.priority || 0;
            const priorityB = b.priority || 0;

            if (priorityA || priorityB) {
              return priorityB - priorityA;
            }

            const participantA = a.participants ? a.participants.length : 0;
            const participantB = b.participants ? b.participants.length : 0;
            return participantB - participantA;
          }
          break;

        case 'nearby':
          compare = (a, b) => {
            const distanceA = a.distance || a.distanceFromOrganizer || 100000;
            const distanceB = b.distance || b.distanceFromOrganizer || 100000;
            return distanceA - distanceB;
          }
          break;

        case 'upcoming':
          compare = (a, b) => {
            const isNearbyA = this.isNearby(a);
            const isNearbyB = this.isNearby(b);
            if (isNearbyA && !isNearbyB) {
              return -1;
            }
            if (!isNearbyA && isNearbyB) {
              return 1;
            }
            if (!isNearbyA && !isNearbyB) {
              const distanceA = a.distance || a.distanceFromOrganizer || 100000;
              const distanceB = b.distance || b.distanceFromOrganizer || 100000;
              return distanceA - distanceB;
            }

            const diffStartA = a.startDate - now;
            const diffStartB = b.startDate - now;

            if (diffStartA >= 0 && diffStartB >= 0) {
              return diffStartA - diffStartB;
            }

            if (diffStartA < 0 && diffStartB < 0) {
              return diffStartA - diffStartB;
            }


            if (diffStartA > 0 && diffStartB < 0) {
              return -1;
            }

            if (diffStartA < 0 && diffStartB > 0) {
              return 1;
            }
          }
          break;

        case 'end':
          compare = (a, b) => {
            return b.startDate - a.startDate;
          }
          break;
      }

      if (!compare) {
        return;
      }
      activities.sort(compare);
      this.setData({
        activities
      }, this.checkContentEmpty);
    },

    requestLocation() {
      wx.onLocationChange((result) => {

      })
      wx.getLocation({
        type: 'wgs84'
      }).then(res => {
        const latitude = res.latitude;
        const longitude = res.longitude
        this.setData({
          latitude,
          longitude
        });

        pref.setLocation(latitude, longitude);

        this.calcDistance();
        this.retrieveCityInfo(latitude, longitude);
      });
    },

    retrieveCityInfo(latitude, longitude) {
      let city = pref.getCity();
      if (city) {
        this.setData({
          city
        });

        return;
      }
      let qqmapsdk = new QQMapWX({
        key: 'EIOBZ-GTTRJ-JEIFC-FYUNA-2QZE5-IYBQ7'
      });

      let that = this;
      qqmapsdk.reverseGeocoder({
        sig: 'dTHcPBDwYFNFnMB0qiQaAVZdHhsmtJq',
        location: {
          latitude,
          longitude
        },
        success(res) {
          city = res.result.ad_info.city;

          if (!city) {
            wx.showToast({
              icon: 'error',
              title: '获取所在城市失败',
            })
            return;
          }
          that.setData({
            city
          });

          pref.setCity(city);
        },
        fail(err) {
          wx.showToast({
            icon: 'error',
            title: '获取所在城市失败',
          })
        }
      })
    },

    fetchActivityCategories() {
      activityRepo.fetchAllActivityCategories().then(categories => {
        categories.unshift(CATEGORY_ALL);

        const {
          categoryBgAccessories
        } = this.data;
        const accessoriesLength = categoryBgAccessories.length;

        for (const [index, category] of categories.entries()) {
          const accessory = categoryBgAccessories[index % accessoriesLength];
          category.accessory = accessory;
        }
        this.setData({
          categories
        }, this.checkContentEmpty);

        this.fetchAllActivities();
      });
    },

    fetchAllActivities() {
      activityRepo.fetchAllPublishedActivities().then(activities => {
        console.log(activities);
        const {
          categories
        } = this.data;

        categories.forEach(category => {
          category.count = 0;
          activities.forEach(activity => {
            const ended = activity.endDate < Date.now();
            if (activity.category == category._id || category._id == 'all') {
              category.count++;
            }
            activity.ended = ended
          });
        });
        this.setData({
          activities,
          categories
        }, this.checkContentEmpty);

        this.calcDistance();
        this.sortActivityByFilter(this.data.selectedActivityFilterId);
      });
    },

    calcDistance() {
      const {
        activities,
        latitude,
        longitude
      } = this.data;

      if (!activities || !latitude) {
        return;
      }

      for (const activity of activities) {
        if (activity.location && activity.location.latitude) {
          const distance = util.calcDistance(activity.location.latitude, activity.location.longitude, latitude, longitude);
          activity.distance = distance;
          activity.distanceStr = `(${distance}km)`;
        }

        const organizerLocation = activity.organizerLocation;
        if (organizerLocation && organizerLocation.latitude) {
          activity.distanceFromOrganizer = util.calcDistance(organizerLocation.latitude, organizerLocation.longitude, latitude, longitude);
        }
      }

      this.setData({
        activities
      }, this.checkContentEmpty);
    },

    onCategorySelected(e) {
      const selectedCategory = e.currentTarget.dataset.category;


      this.setData({
        selectedCategory
      }, this.checkContentEmpty);
    },

    checkContentEmpty() {
      wx.createSelectorQuery().in(this).select('#activityContainer').boundingClientRect(rect => {
        if (!rect) {
          return;
        }
        const isEmpty = rect.height <= 0;
        const {
          showEmptyMessage
        } = this.data;
        if (isEmpty != showEmptyMessage) {
          this.setData({
            showEmptyMessage: isEmpty
          });
        }
      }).exec()
    },

    onClickDraftActivity() {
      const userInfo = app.globalData.userInfo;
      if (userInfo && userInfo.company) {
        router.navigateToDraftActivity();
        return;
      }

      wx.showLoading();
      userRepo.fetchUserInfoOrSignup().then(user => {
        wx.hideLoading();
        if (user.company) {
          router.navigateToDraftActivity();
        } else {
          router.navigateToAuth(router.AUTH_ORIGIN_DRAFT_ACTIVITY);
        }
      }).catch(err => {
        wx.hideLoading();
        wx.showToast({ 
          icon: 'none',
          title: "Can't post in anonymously",
        })
      });
    },
  },

  lifetimes: {
    attached() {
      this.fetchActivityCategories();
      this.requestLocation();
    },
  }
})