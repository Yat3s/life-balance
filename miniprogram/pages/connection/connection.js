import { fetchRecentActivities } from '../../repository/activityRepo';
import { getAppConfig } from '../../repository/baseRepo';
import { fetchWechatGroups } from '../../repository/dashboardRepo';
import { fetchAllTeams, joinCircle } from '../../repository/exploreRepo';
import { fetchUserInfo } from '../../repository/userRepo';
import {
  navigateToActivityDetail,
  navigateToDraftActivity,
  navigateToActivityPage,
  navigateToAuth,
} from '../router';

const app = getApp();
const COLLAPSED_SCROLL_TOP = 200;
const MIN_TITLE_SCALE = 0.5;
const MIN_SUBTITLE_SCALE = 0.9;
const MAX_APP_BAR_HEIGHT = 200; //px
const ADD_CIRCLE_LINK =
  'https://github.com/Yat3s/Life-Balance/issues/new/choose';
const MIN_DISPLAY_ACTIVITY_LENGTH = 3;

// pages/explore/explore.js
Component({
  options: {
    addGlobalClass: true,
  },

  /**
   * 页面的初始数据
   */
  data: {
    toolbarHeight: app.globalData.toolbarHeight,
    statusBarHeight: app.globalData.statusBarHeight,
    showSearchPage: false,
    circleSearchFocus: false,
    titleScale: 1.0,
    appBarHeight: MAX_APP_BAR_HEIGHT,
    collapsed: false,
  },

  pageLifetimes: {
    show() {
      // Refresh data
      if (this.data.activities) {
        this.loadRecentActivities();
      }
    },
  },

  lifetimes: {
    attached() {
      getAppConfig().then((config) => {
        this.setData({
          circleKeywords: config.circleKeywords,
        });
      });

      this.loadRecentActivities();

      this.loadCircleData();
    },
  },

  methods: {
    loadRecentActivities() {
      fetchRecentActivities().then((activities) => {
        const displayActivities = [];
        for (const activity of activities) {
          if (displayActivities.length < MIN_DISPLAY_ACTIVITY_LENGTH) {
            displayActivities.push(activity);
            continue;
          }

          if (activity.isActive) {
            displayActivities.push(activity);
          }
        }
        displayActivities.push();
        this.setData({
          activities: displayActivities,
        });
      });
    },

    loadCircleData() {
      const calls = [fetchWechatGroups(), fetchAllTeams(), fetchUserInfo()];
      Promise.allSettled(calls).then((results) => {
        const circles = results[0].value;
        const teams = results[1].value;
        const userInfo = results[2].value;
        circles.forEach((item) => {
          let joined = false;
          if (item.participants) {
            for (const participant of item.participants) {
              if (userInfo && participant._openid === userInfo._openid) {
                joined = true;
                break;
              }
            }
          }

          item.shrinkCode =
            item.code.substring(0, item.code.length / 2) +
            '*'.repeat(item.code.length / 2);

          if (item.teamOnly) {
            for (const team of teams) {
              if (team._id === item.teamOnly) {
                item.teamOnlyStr = team.name;
                break;
              }
            }
          }

          item.joined = joined;
        });
        this.setData({
          userInfo,
          circles,
        });
      });
    },

    onPageScrolled(e) {
      const scrollTop = Math.min(COLLAPSED_SCROLL_TOP, e.detail.scrollTop);
      const minAppBarHeight =
        app.globalData.toolbarHeight + app.globalData.statusBarHeight;
      const appBarHeight =
        MAX_APP_BAR_HEIGHT -
        (MAX_APP_BAR_HEIGHT - minAppBarHeight) *
          (scrollTop / COLLAPSED_SCROLL_TOP);
      const collapsed = appBarHeight == minAppBarHeight;
      if (this.data.collapsed === true && collapsed === true) {
        return;
      }
      const titleScale =
        1.0 - (scrollTop / COLLAPSED_SCROLL_TOP) * (1.0 - MIN_TITLE_SCALE);
      const subtitleScale =
        1.0 - (scrollTop / COLLAPSED_SCROLL_TOP) * (1.0 - MIN_SUBTITLE_SCALE);

      this.setData({
        titleScale,
        subtitleScale,
        appBarHeight,
        collapsed,
      });
      console.log(e);
    },

    onJoinClicked() {
      const { userInfo, showingCircle } = this.data;

      if (!userInfo || !userInfo.company) {
        wx.showModal({
          title: 'Join failed',
          icon: 'error',
          content: 'Please verify your company first 请先完成企业认证.',
          success(res) {
            if (res.confirm) {
              navigateToAuth();
            } else if (res.cancel) {
              console.log('用户点击取消');
            }
          },
        });

        return;
      }

      if (showingCircle.teamOnly && userInfo.team !== showingCircle.teamOnly) {
        wx.showModal({
          title: 'Join failed',
          icon: 'error',
          content: `Only members of the ${showingCircle.teamOnlyStr} team are allowed to join this group`,
          success(res) {},
        });

        return;
      }

      wx.setClipboardData({
        data: showingCircle.code,
      });

      wx.showToast({
        icon: 'none',
        title: 'Group code copied',
      });

      this.setData({
        showingModal: 'joinSuccess',
      });

      if (!showingCircle.joined) {
        joinCircle(showingCircle._id, userInfo).then((res) => {
          this.loadCircleData();
        });
      }
    },

    copyGroupCode() {
      const { showingCircle } = this.data;

      wx.setClipboardData({
        data: showingCircle.code,
      });

      wx.showToast({
        icon: 'none',
        title: 'Group code copied',
      });
    },

    onSearchCircleChanged(e) {
      const keyword = e.detail.value;
      this.searchCircle(keyword);
    },

    onCircleItemClicked(e) {
      const showingCircle = e.currentTarget.dataset.circle;
      this.setData({
        showingCircle,
        showingModal: 'circle',
      });
    },

    onCircleSearchClicked() {
      this.setData({
        showSearchPage: true,
      });
    },

    onCircleKeyboardClicked(e) {
      const keyword = e.currentTarget.dataset.keyword;
      this.setData({
        searchCircleInput: keyword,
      });
      this.searchCircle(keyword);
    },

    onDismissSearchPage() {
      this.setData({
        searchCircleInput: '',
        showSearchPage: false,
      });

      setTimeout(() => {
        const { circles } = this.data;
        circles.forEach((item) => {
          item.hide = false;
        });
        this.setData({
          circles,
        });
      }, 300);
    },

    searchCircle(keyword) {
      const { circles } = this.data;
      for (const circle of circles) {
        let combinedQueryText = circle.name;
        if (circle.citys) {
          combinedQueryText += ';' + circle.citys.join(';');
        }
        if (circle.tags) {
          combinedQueryText += ';' + circle.tags.join(';');
        }
        if (circle.teamOnly) {
          combinedQueryText += ';' + circle.teamOnlyStr;
        }

        circle.hide =
          combinedQueryText.toLowerCase().search(keyword.toLowerCase()) == -1;
      }

      this.setData({
        circles,
      });
    },

    onDismissModal() {
      this.setData({
        showingModal: '',
      });
    },

    onCopyAddCircleLink() {
      wx.setClipboardData({
        data: ADD_CIRCLE_LINK,
      });
      this.setData({
        showingModal: '',
      });
    },

    onAddCircleClicked() {
      this.setData({
        showingModal: 'addCircle',
      });
    },

    onCircleSearchPageEnter() {
      console.log('onCircleSearchPageEnter');
      this.setData(
        {
          showCircleSearchContent: true,
        },
        () => {
          setTimeout(() => {
            this.setData({
              circleSearchFocus: true,
            });
          }, 200);
        }
      );
    },

    onCircleImageClick() {
      wx.previewImage({
        urls: [this.data.showingCircle.coverPic],
      });
    },

    onCircleSearchPageExit() {
      this.setData({
        showCircleSearchContent: false,
      });
    },

    // Activity
    onActivityItemClicked(e) {
      const id = e.currentTarget.dataset.id;
      navigateToActivityDetail(id);
    },

    onMoreActivitiesClicked() {
      navigateToActivityPage();
    },

    onNewActivityClicked() {
      navigateToDraftActivity();
    },
  },
});
