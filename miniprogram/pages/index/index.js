const app = getApp();
import {
  getAppConfig
} from "../../repository/baseRepo";
import {
  fetchUserInfo
} from "../../repository/userRepo";
import {
  navigateToOnboarding
} from "../router";

const homeV2Enabled = true;

Page({
  data: {
    showingModal: null,
    currentTab: "board",
    tabIndicatorWidth: 0,
    tabIndicatorOffset: 0,
    navigationBarHeight: app.globalData.navigationBarHeight, // Safe area
    selectedGenderIndex: 0,
    homeV2Enabled,
    pages: [{
        id: "board",
        title: "Home",
        icon: "../../images/ic_board.png",
        iconActive: "../../images/ic_board_active.png",
      },
      {
        id: "mall",
        title: "Mall",
        icon: "../../images/ic_mall.png",
        iconActive: "../../images/ic_mall_active.png",
      },
      {
        id: "connection",
        title: "Connection",
        icon: "../../images/ic_connect.png",
        iconActive: "../../images/ic_connect_active.png",
      },
      {
        id: "user",
        title: "User",
        icon: "../../images/ic_user.png",
        iconActive: "../../images/ic_user_active.png",
      },
    ],
  },

  onLoad(options) {
    const {
      page,
      productId
    } = options;
    const {
      windowWidth,
      statusBarHeight
    } = app.globalData;

    if (productId) {
      wx.setStorageSync("shared_product_id", productId);
      this.setData({
        currentTab: "mall",
      });
    }
    this.setData({
      tabWidth: windowWidth / (this.data.pages.length + 1),
      statusBarHeight,
      ...this.getTabIndicator(page || this.data.currentTab),
    });

    getAppConfig().then((config) => {
      const {
        featureFlags
      } = config;
      let pages = [...this.data.pages];

      // Remove mall tab if explicitly disabled
      if (featureFlags.mallEnabled === false) {
        pages = pages.filter((page) => page.id !== "mall");
      }

      // Handle carpool tab
      const carpoolTabItem = {
        id: "carpool",
        title: "Carpool",
        icon: "../../images/ic_carpool.png",
        iconActive: "../../images/ic_carpool_active.png",
      };

      if (featureFlags.carpoolEnabled) {
        const connectionIndex = pages.findIndex(
          (page) => page.id === "connection"
        );
        pages.splice(connectionIndex, 0, carpoolTabItem);
      }

      this.setData({
        featureFlags,
        pages,
        ...this.getTabIndicator(this.data.currentTab, pages),
      });
      this.alignTabIndicator();
    });

    // Handle initial page selection and potential user info check
    if (page) {
      this.setData({
        currentTab: page,
        ...this.getTabIndicator(page),
      });
      this.checkAndFetchUserInfo(); // Check and fetch user info if necessary
    }
  },

  getTabIndicator(tabId, pages = this.data.pages) {
    const windowWidth = app.globalData.windowWidth || 375;
    const tabWidth = this.data.tabWidth || windowWidth / 5;
    const selectedIndex = pages.findIndex((page) => page.id === tabId);
    // Match the original flex layout: 24rpx on each side, selected width × 1.5.
    // With five tabs, flex-shrink scales all widths down by the same ratio.
    const availableWidth = windowWidth * (1 - 48 / 750);
    const renderedTabWidth = Math.min(tabWidth, availableWidth / (pages.length + 0.5));
    return {
      tabIndicatorWidth: selectedIndex < 0 ? 0 : renderedTabWidth * 1.5,
      tabIndicatorOffset: Math.max(0, selectedIndex) * 100 / 1.5,
    };
  },

  onReady() {
    this.alignTabIndicator();
  },

  onUnload() {
    this._tabDisposed = true;
    clearTimeout(this._tabAlignmentTimer);
  },

  alignTabIndicator() {
    // Long labels can impose a larger min-content width in the original flex layout.
    // Align to the rendered button once the width transition has completed.
    if (!this.createSelectorQuery) return;
    clearTimeout(this._tabAlignmentTimer);
    const selectedTab = this.data.currentTab;
    this._tabAlignmentTimer = setTimeout(() => {
      this.createSelectorQuery()
        .select(".tab-container").boundingClientRect()
        .select(".tab-highlight").boundingClientRect()
        .exec(([container, selected]) => {
          if (this._tabDisposed || !container || !selected || !selected.width || selectedTab !== this.data.currentTab) return;
          const inset = 24 * (app.globalData.windowWidth || 375) / 750;
          this.setData({
            tabIndicatorWidth: selected.width,
            tabIndicatorOffset: (selected.left - container.left - inset) * 100 / selected.width,
          });
        });
    }, 380);
  },

  onTabSelect(e) {
    const currentTab = e.currentTarget.dataset.tabid;
    if (currentTab === this.data.currentTab) return;
    if (!this.data.pages.some((page) => page.id === currentTab)) return;
    this.setData({
      currentTab,
      ...this.getTabIndicator(currentTab),
    });
    this.alignTabIndicator();

    if (currentTab !== "mall") {
      wx.removeStorageSync("shared_product_id");
    }

    this.checkAndFetchUserInfo();
  },

  checkAndFetchUserInfo() {
    const {
      currentTab
    } = this.data;
    if (
      currentTab === "user" ||
      currentTab === "mall" ||
      currentTab === "connection"
    ) {
      fetchUserInfo().then((userInfo) => {
        if (userInfo) {
          app.globalData.userInfo = userInfo;
          const needsUpdate = this.checkNeedsProfileUpdate(userInfo);
          if (needsUpdate) {
            this.onOpenUpdateUserInfoModal(userInfo._id);
          }
        } else {
          this.setData({
            currentTab: "board",
            ...this.getTabIndicator("board"),
          });
          this.alignTabIndicator();
          navigateToOnboarding();
        }
      });
    }
  },

  checkNeedsProfileUpdate(userInfo) {
    if (!userInfo || userInfo.updatedAt) return false;

    const isDefaultAvatar = userInfo.avatarUrl?.startsWith(
      "https://thirdwx.qlogo.cn/mmopen/vi_32/"
    );
    const isDefaultNickName = userInfo.nickName === "微信用户";

    return isDefaultNickName || isDefaultAvatar;
  },

  onShow() {
    if (app.globalData.pendingMessage) {
      wx.showToast({
        icon: "none",
        duration: 3000,
        title: app.globalData.pendingMessage,
      });
      app.globalData.pendingMessage = null;
    }
  },

  onOpenUpdateUserInfoModal(userId) {
    // Keep reminders to once per user for this app session, even if the page is recreated.
    const promptedUserIds = app.globalData.profilePromptedUserIds;
    if (promptedUserIds.includes(userId)) return;
    promptedUserIds.push(userId);

    this.setData({
      showingModal: "update-userinfo",
    });
  },

  hideModal() {
    this.setData({
      showingModal: null,
    });
  },

  // You must define the method below, otherwise you cannot share to wechat
  onShareAppMessage() {
    if (
      this.data.currentTab === "mall" &&
      this.selectComponent("#mall")?.data.selectedProduct
    ) {
      const mall = this.selectComponent("#mall");
      const product = mall.data.selectedProduct;
      const titlePrefix = product.type === "sell" ? "来捡漏啦！" : "诚求！";
      const shareTitle = `${titlePrefix}${product.title}`;

      return {
        title: shareTitle,
        imageUrl: product.pictures?.[0],
        path: `/pages/index/index?page=mall&productId=${product._id}`,
      };
    }

    return {
      path: "/pages/index/index?page=" + this.data.currentTab,
    };
  },

  onShareTimeline() {
    return {
      query: "page=" + this.data.currentTab,
    };
  },
});
