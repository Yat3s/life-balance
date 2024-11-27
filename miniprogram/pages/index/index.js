const app = getApp();
import { getAppConfig } from "../../repository/baseRepo";
import { fetchUserInfo } from "../../repository/userRepo";
import { navigateToOnboarding } from "../router";

const homeV2Enabled = true;

Page({
  data: {
    showingModal: null,
    currentTab: "board",
    navigationBarHeight: app.globalData.navigationBarHeight, // Safe area
    selectedGenderIndex: 0,
    homeV2Enabled,
    pages: [
      {
        id: "board",
        title: "Home",
        icon: "../../images/ic_board.png",
        iconActive: "../../images/ic_board_active.png",
        isBeta: homeV2Enabled,
      },
      {
        id: "mall",
        title: "Mall",
        icon: "../../images/ic_mall.png",
        iconActive: "../../images/ic_mall_active.png",
        isBeta: true,
      },
      {
        id: "connection",
        title: "Connection",
        icon: "../../images/ic_connect.png",
        iconActive: "../../images/ic_connect_active.png",
        isBeta: false,
      },
      {
        id: "user",
        title: "User",
        icon: "../../images/ic_user.png",
        iconActive: "../../images/ic_user_active.png",
        isBeta: false,
      },
    ],
  },

  onLoad(options) {
    const { page, productId } = options;
    const { windowWidth, statusBarHeight } = app.globalData;

    if (productId) {
      wx.setStorageSync("shared_product_id", productId);
      this.setData({
        currentTab: "mall",
      });
    }
    this.setData({
      tabWidth: windowWidth / (this.data.pages.length + 1),
      statusBarHeight,
    });

    getAppConfig().then((config) => {
      const { featureFlags } = config;
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
      });
    });

    // Handle initial page selection and potential user info check
    if (page) {
      this.setData({
        currentTab: page,
      });
      this.checkAndFetchUserInfo(); // Check and fetch user info if necessary
    }
  },

  onTabSelect(e) {
    const currentTab = e.currentTarget.dataset.tabid;
    this.setData({
      currentTab,
    });

    if (currentTab !== "mall") {
      wx.removeStorageSync("shared_product_id");
    }

    this.checkAndFetchUserInfo();
  },

  checkAndFetchUserInfo() {
    const { currentTab } = this.data;
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
            this.onOpenUpdateUserInfoModal();
          }
        } else {
          this.setData({
            currentTab: "board",
          });
          navigateToOnboarding();
        }
      });
    }
  },

  checkNeedsProfileUpdate(userInfo) {
    if (!userInfo) return false;
    if (userInfo.updatedAt) return false;

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

  onOpenUpdateUserInfoModal() {
    this.setData({
      showingModal: "update-userinfo",
    });
  },

  hideModal() {
    this.setData({
      showingModal: null,
    });
  },

  // You must define the method below, otherwise you cannot share
  // Share to WeChat
  onShareAppMessage() {
    if (
      this.data.currentTab === "mall" &&
      this.selectComponent("#mall")?.data.selectedProduct
    ) {
      const mall = this.selectComponent("#mall");
      const product = mall.data.selectedProduct;
      const titlePrefix = product.type === "sell" ? "来捡漏啦，" : "诚求，";
      const priceText = product.price ? `【${product.price}】` : "";
      const shareTitle = `${titlePrefix}${priceText}${product.title}`;

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
});
