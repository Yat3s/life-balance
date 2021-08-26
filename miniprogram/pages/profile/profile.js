// pages/profile/profile.js
const app = getApp();
const activityRepo = require('../../repository/activityRepo');
const userRepo = require('../../repository/userRepo');
const router = require('../router');

Component({
  options: {
    addGlobalClass: true
  },

  /**
   * 组件的属性列表
   */
  properties: {

  },

  /**
   * 组件的初始数据
   */
  data: {
    windowWidth: app.globalData.windowWidth,
    selectedTabId: 'all',
    organizeCount: 0,
    showEmpty: true,
    tabs: [{
        id: 'all',
        name: "全部活动",
        count: 0,
      },
      {
        id: 'organizer',
        name: "发起的活动",
        count: 0,
      },

      {
        id: 'like',
        name: "收藏的活动",
        count: 0,
      },
    ]
  },

  /**
   * 组件的方法列表
   */
  methods: {
    onTabSelected(e) {
      const selectedTabId = e.currentTarget.dataset.id;
      const {
        activities,
        likedActivities
      } = this.data;

      let showEmpty = false;
      switch (selectedTabId) {
        case 'all':
          showEmpty = !activities || activities.length == 0;
          break;

        case 'organizer':
          let count = 0;
          activities.forEach(activity => {
            if (activity.type == 'organizer') {
              count++;
            }
          })
          showEmpty = count == 0;
          break;

        case 'like':
          showEmpty = !likedActivities || likedActivities.length == 0;
          break;
      }

      this.setData({
        selectedTabId,
        showEmpty,
      });
    },

    fetchAllLikedActivities(ids) {
      if (!ids) {
        return;
      }

      activityRepo.fetchActivitiesByIds(ids).then(likedActivities => {
        this.setData({
          likedActivities
        });

        this.updateTabCount('like', likedActivities.length);
      })
    },

    fetchAllPersonalActivities(openid) {
      activityRepo.fetchAllPersonalActivities().then(activities => {

        let organizeCount = 0;
        activities.forEach(activity => {
          if (activity.organizer._openid == openid) {
            activity.type = 'organizer';
            organizeCount++;
          }
        });

        this.setData({
          activities,
          showEmpty: activities.length == 0
        });

        this.updateTabCount('organizer', organizeCount);
        this.updateTabCount('all', activities.length);
      })
    },

    onUserInfoClick(e) {
      router.navigate(router.Pages.UserInfo);
    },

    updateTabCount(tabId, count) {
      const {
        tabs
      } = this.data;
      for (const tab of tabs) {
        if (tab.id == tabId) {
          tab.count = count;
          break;
        }
      }

      this.setData({
        tabs
      });
    }
  },


  pageLifetimes: {
    show() {
      // Update profile
      userRepo.fetchUserInfo().then(userInfo => {
        if (!userInfo) {
          return;
        }

        this.setData({
          userInfo
        });
      })
    }
  },
  lifetimes: {
    attached() {
      userRepo.fetchUserInfo().then(userInfo => {
        if (!userInfo) {
          return;
        }

        this.setData({
          userInfo
        });

        this.fetchAllPersonalActivities(userInfo._openid);
        this.fetchAllLikedActivities(userInfo.likes);
      })
    }
  }
})