import { formatTimeAgo } from '../../common/util';
import { getAppConfig } from '../../repository/baseRepo';
import { fetchAllProducts } from '../../repository/productRepo';
import { createOrder, updateOrder } from '../../repository/orderRepo';
import { navigateToPublishItem } from '../router';

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
  },

  pageLifetimes: {
    show() {
      this.fetchAllProducts();
    },
  },

  lifetimes: {
    attached() {
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

    fetchAllProducts() {
      fetchAllProducts().then((res) => {
        if (res) {
          const processedData = res.data.map((product) => ({
            ...product,
            formattedTime: formatTimeAgo(product.createdAt),
          }));

          const officialProducts = processedData.filter(
            (product) => product.type === 'official'
          );
          const secondhandProducts = processedData.filter(
            (product) => product.type === 'secondhand'
          );

          this.setData(
            {
              officialProducts,
              secondhandProducts,
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

    handleOpenProductModal(e) {
      const product = e.currentTarget.dataset.product;

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

    handleCreateOrder() {
      const { selectedProduct } = this.data;
      var that = this;

      createOrder(selectedProduct._id)
        .then((order) => {
          const { payment, orderId, totalFee } = order;

          wx.requestPayment({
            ...payment,
            success(res) {
              updateOrder(orderId, totalFee);

              wx.showToast({
                title: '支付成功',
                icon: 'success',
              });
            },
            fail(err) {
              wx.showToast({
                title: '支付失败，请重试',
                icon: 'none',
              });
            },
          });
        })
        .catch((error) => {
          wx.showToast({
            title: '创建订单失败，请重试',
            icon: 'none',
          });
        });
    },
  },
});
