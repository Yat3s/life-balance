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
const MAX_APP_BAR_HEIGHT = 200; //px

Component({
  options: {
    addGlobalClass: true,
  },
  properties: {},
  data: {
    officialProducts: null,
    secondhandProducts: null,
    leftColumnProducts: null,
    rightColumnProducts: null,
    fleaMarketKeywords: null,
    toolbarHeight: app.globalData.toolbarHeight,
    statusBarHeight: app.globalData.statusBarHeight,
    appBarHeight: MAX_APP_BAR_HEIGHT,
    selectedCategory: 'New', // Default selected category
    popularProductsEnabled: false,
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
              secondhandProducts: processedData,
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
      const { secondhandProducts, selectedCategory } = this.data;
      let filteredProducts = [...secondhandProducts];

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

      this.setData(
        {
          filteredSecondhandProducts: filteredProducts,
        },
        () => {
          this.distributeProductsToColumns();
        }
      );
    },

    distributeProductsToColumns() {
      const { filteredSecondhandProducts } = this.data;
      const leftColumn = [];
      const rightColumn = [];

      filteredSecondhandProducts.forEach((product, index) => {
        if (index % 2 === 0) {
          leftColumn.push(product);
        } else {
          rightColumn.push(product);
        }
      });

      this.setData({
        leftColumnProducts: leftColumn,
        rightColumnProducts: rightColumn,
      });
    },

    handleCategorySelect(e) {
      const selectedCategory = e.currentTarget.dataset.category;
      this.setData(
        {
          selectedCategory,
          searchInput: '',
          isSearchActive: false,
        },
        () => {
          this.filterProductsByCategory();
        }
      );
    },

    handleNavToPublishItemPage() {
      navigateToPublishItem();
    },

    hideModal() {
      this.setData({
        showingModal: null,
      });
    },

    handleProductClick(e) {
      const product = e.currentTarget.dataset.product || e.detail;
      this.setData({
        showingModal: 'product',
        selectedProduct: product,
      });
    },

    handleViewAllPopularProducts() {
      this.setData({
        showingModal: 'official-products',
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

    toggleSearchInput() {
      this.setData({
        isSearchActive: true,
      });
      this.filterProductsByCategory();
    },

    onSearchBlur() {
      if (!this.data.searchInput) {
        this.setData({
          isSearchActive: false,
        });
      }
    },

    onSearchChanged(e) {
      const keyword = e.detail.value?.toLowerCase() || '';
      this.setData({
        searchInput: e.detail.value || '',
      });

      if (!keyword) {
        this.filterProductsByCategory();
        return;
      }

      const { filteredSecondhandProducts } = this.data;
      const searchResults = filteredSecondhandProducts.filter((product) =>
        this.productMatchesSearch(product, keyword)
      );

      const leftColumn = [];
      const rightColumn = [];
      searchResults.forEach((product, index) => {
        if (index % 2 === 0) {
          leftColumn.push(product);
        } else {
          rightColumn.push(product);
        }
      });

      this.setData({
        leftColumnProducts: leftColumn,
        rightColumnProducts: rightColumn,
      });
    },

    productMatchesSearch(product, keyword) {
      return (
        product.title?.toLowerCase().includes(keyword) ||
        product.description?.toLowerCase().includes(keyword) ||
        product.categories?.some((category) =>
          category.toLowerCase().includes(keyword)
        ) ||
        parseFloat(keyword) === product.price
      );
    },

    onProductKeywordClicked(e) {
      const keyword = e.currentTarget.dataset.keyword;
      this.setData({
        searchInput: keyword,
      });
      this.onSearchChanged({
        detail: { value: keyword },
      });
    },
  },
});
