const { fetchAllPersonalCarpools } = require('../../repository/carpoolRepo');
const activityRepo = require('../../repository/activityRepo');
const userRepo = require('../../repository/userRepo');
const router = require('../router');
const app = getApp();

Component({
  options: {
    addGlobalClass: true,
  },

  properties: {},

  data: {
    windowWidth: app.globalData.windowWidth,
    selectedTabId: 'all',
    organizeCount: 0,
    showEmpty: true,
    tabs: [
      {
        id: 'all',
        name: 'All activities',
        count: 0,
      },
      {
        id: 'organizer',
        name: 'Posted activities',
        count: 0,
      },
      {
        id: 'like',
        name: 'Favorite activities',
        count: 0,
      },
      {
        id: 'carpool',
        name: 'All carpools',
        count: 0,
      },
    ],
  },

  methods: {
    onSettingCompanyClick() {
      router.navigateToAuth();
    },
    onTabSelected(e) {
      const selectedTabId = e.currentTarget.dataset.id;
      const { activities, likedActivities, carpools } = this.data;

      let showEmpty = false;
      switch (selectedTabId) {
        case 'all':
          showEmpty = !activities || activities.length == 0;
          break;

        case 'organizer':
          let count = 0;
          activities.forEach((activity) => {
            if (activity.type == 'organizer') {
              count++;
            }
          });
          showEmpty = count == 0;
          break;

        case 'like':
          showEmpty = !likedActivities || likedActivities.length == 0;
          break;

        case 'carpool':
          showEmpty = !carpools || carpools.length == 0;
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

      activityRepo.fetchActivitiesByIds(ids).then((likedActivities) => {
        this.setData({
          likedActivities,
        });

        this.updateTabCount('like', likedActivities.length);
      });
    },

    fetchAllPersonalActivities(openid) {
      activityRepo.fetchAllPersonalActivities().then((activities) => {
        let organizeCount = 0;
        activities.forEach((activity) => {
          if (activity.organizer._openid == openid) {
            activity.type = 'organizer';
            organizeCount++;
          }
        });

        this.setData({
          activities,
          showEmpty: activities.length == 0,
        });

        this.updateTabCount('organizer', organizeCount);
        this.updateTabCount('all', activities.length);
      });
    },

    onUserInfoClick(e) {
      router.navigate(router.Pages.UserInfo);
    },

    updateTabCount(tabId, count) {
      const { tabs } = this.data;
      for (const tab of tabs) {
        if (tab.id == tabId) {
          tab.count = count;
          break;
        }
      }

      this.setData({
        tabs,
      });
    },
  },

  pageLifetimes: {
    show() {
      // Update profile
      userRepo.fetchUserInfo().then((userInfo) => {
        if (!userInfo) {
          return;
        }

        this.setData({
          userInfo,
        });
      });
    },
  },

  lifetimes: {
    attached() {
      userRepo.fetchUserInfo().then((userInfo) => {
        if (!userInfo) {
          return;
        }

        this.setData({
          userInfo,
        });

        this.fetchAllPersonalActivities(userInfo._openid);
        this.fetchAllLikedActivities(userInfo.likes);

        fetchAllPersonalCarpools().then((carpools) => {
          this.setData({
            carpools,
          });
          this.updateTabCount('carpool', carpools.length);
        });

        if (userInfo.company) {
          userRepo.fetchCompany(userInfo.company).then((company) => {
            this.setData({ company });
          });
        }
      });
    },
  },
});
