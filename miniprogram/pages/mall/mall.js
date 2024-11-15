import { formatTimeAgo } from '../../common/util';
import { getAppConfig } from '../../repository/baseRepo';
import {
  fetchAllFleaMarketProducts,
  fetchAllProducts,
} from '../../repository/productRepo';
import { fetchUserInfo } from '../../repository/userRepo';
import { navigateToPublishItem, navigateToPurchase } from '../router';

const app = getApp();
const COLLAPSED_SCROLL_TOP = 200;
const MIN_TITLE_SCALE = 0.5;
const MIN_SUBTITLE_SCALE = 0.9;
const MAX_APP_BAR_HEIGHT = 200; // px

Component({
  options: {
    addGlobalClass: true,
  },
  properties: {},
  data: {
    products: null,
    fleaMarketProducts: null,
    fleaMarketKeywords: null,
    toolbarHeight: app.globalData.toolbarHeight,
    statusBarHeight: app.globalData.statusBarHeight,
    appBarHeight: MAX_APP_BAR_HEIGHT,
    selectedCategory: 'New',
    popularProductsEnabled: true,
    showSearchPage: false,
  },

  pageLifetimes: {
    show() {
      this.fetchAllFleaMarketProducts();
      this.fetchAllProducts();
    },
  },

  lifetimes: {
    attached() {
      this.fetchAllFleaMarketProducts();
      this.fetchUserInfo();
      this.fetchAllProducts();
    },
  },

  methods: {
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
    },

    fetchUserInfo() {
      fetchUserInfo().then((res) => {
        if (res) {
          this.setData({
            userInfo: res,
          });
        }
      });
    },

    fetchAllFleaMarketProducts() {
      fetchAllFleaMarketProducts().then((res) => {
        if (res) {
          const processedData = res.data.map((product) => ({
            ...product,
            formattedTime: formatTimeAgo(product.createdAt),
            type: 'secondhand',
          }));

          this.setData(
            {
              originalFleaMarketProducts: processedData,
              fleaMarketProducts: processedData,
            },
            () => {
              this.filterProductsByCategory();
            }
          );
        }
      });

      getAppConfig().then((config) => {
        this.setData({
          fleaMarketKeywords: config.fleaMarketKeywords,
        });
      });
    },

    fetchAllProducts() {
      fetchAllProducts().then((res) => {
        if (res) {
          const processedData = res.data.map((product) => ({
            ...product,
            formattedTime: formatTimeAgo(product.createdAt),
            type: 'popular',
          }));

          this.setData({
            products: processedData,
          });
        }
      });
    },

    filterProductsByCategory() {
      const { originalFleaMarketProducts, selectedCategory } = this.data;
      let filteredProducts = [...originalFleaMarketProducts];

      switch (selectedCategory) {
        case 'New':
          filteredProducts.sort((a, b) => b.updatedAt - a.updatedAt);
          break;
        case '微软员工专属':
          filteredProducts = filteredProducts.filter(
            (product) => product.isInternal === true
          );
          break;
        default:
          filteredProducts = filteredProducts.filter(
            (product) =>
              product.categories &&
              product.categories.includes(selectedCategory)
          );
      }

      this.setData({
        fleaMarketProducts: filteredProducts,
      });
    },

    handleCategorySelect(e) {
      const selectedCategory = e.currentTarget.dataset.category;
      this.setData(
        {
          selectedCategory,
        },
        () => {
          this.filterProductsByCategory();
        }
      );
    },

    handleProductClick(e) {
      const item = e.detail?.item || e.currentTarget.dataset.product;
      if (!item) return;

      if (item.type === 'secondhand') {
        if (item.isInternal && !this.data.userInfo?.company) return;
      }

      this.setData({
        showingModal: 'product',
        selectedProduct: item,
      });
    },

    handleNavToPublishItemPage() {
      navigateToPublishItem();
    },

    hideModal() {
      this.setData({
        showingModal: null,
      });
    },

    handleViewAllPopularProducts() {
      this.setData({
        showingModal: 'products',
      });
    },

    handleCopyContact(e) {
      const { contact } = e.currentTarget.dataset;
      wx.setClipboardData({
        data: contact,
        success: () => {
          wx.showToast({
            title: '已复制联系方式',
            icon: 'success',
            duration: 2000,
          });
        },
      });
    },

    onPurchase(e) {
      const id = e.currentTarget.dataset.id;
      navigateToPurchase(id);
    },

    previewProductPicture() {
      wx.previewImage({
        urls: this.data.selectedProduct.pictures,
      });
    },

    previewUserAvatar() {
      wx.previewImage({
        urls: [this.data.selectedProduct.user.avatarUrl],
      });
    },

    onSearchPageEnter() {
      this.setData(
        {
          showProductSearchContent: true,
          fleaMarketProducts: this.data.originalFleaMarketProducts,
        },
        () => {
          setTimeout(() => {
            this.setData({
              searchFocus: true,
            });
          }, 200);
        }
      );
    },

    searchProduct(keyword) {
      if (!keyword) {
        this.setData({
          fleaMarketProducts: this.data.originalFleaMarketProducts,
        });
        return;
      }

      const searchResults = this.data.originalFleaMarketProducts.filter(
        (product) => {
          if (product.title.toLowerCase().includes(keyword.toLowerCase())) {
            return true;
          }

          if (
            product.description?.toLowerCase().includes(keyword.toLowerCase())
          ) {
            return true;
          }

          if (
            product.categories?.some((category) =>
              category.toLowerCase().includes(keyword.toLowerCase())
            )
          ) {
            return true;
          }

          const searchPrice = parseFloat(keyword);
          if (!isNaN(searchPrice) && product.price === searchPrice) {
            return true;
          }

          return false;
        }
      );

      this.setData({
        fleaMarketProducts: searchResults,
      });
    },

    onSearchChanged(e) {
      const keyword = e.detail.value;
      this.setData({
        searchInput: keyword,
      });
      this.searchProduct(keyword);
    },

    onProductKeyboardClicked(e) {
      const keyword = e.currentTarget.dataset.keyword;
      this.setData({
        searchInput: keyword,
      });
      this.searchProduct(keyword);
    },

    onDismissSearchPage() {
      this.setData({
        searchInput: '',
        showSearchPage: false,
        fleaMarketProducts: this.data.originalFleaMarketProducts,
      });

      setTimeout(() => {
        this.filterProductsByCategory();
      }, 300);
    },

    onSearchPageExit() {
      this.setData({
        showProductSearchContent: false,
      });
    },

    onSearchClicked() {
      this.setData({
        showSearchPage: true,
      });
    },
  },
});
