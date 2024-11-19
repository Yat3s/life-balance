import { formatTimeAgo } from '../../common/util';
import { getAppConfig } from '../../repository/baseRepo';
import {
  deleteUserProduct,
  fetchAllFleaMarketProducts,
  fetchAllProducts,
  updateWantedBy,
  updateUserProduct,
} from '../../repository/productRepo';
import { fetchUserInfo } from '../../repository/userRepo';
import {
  navigateToAuth,
  navigateToPublishItem,
  navigateToPurchase,
} from '../router';

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
    popularProducts: null,
    secondhandProducts: null,
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
          fleaMarketKeywords: config.mall.fleaMarketKeywords,
        });
      });
    },

    fetchAllProducts() {
      fetchAllProducts().then((res) => {
        if (res) {
          const processedData = res.data.map((product) => ({
            ...product,
            formattedTime: formatTimeAgo(product.createdAt),
          }));

          this.setData({
            popularProducts: processedData,
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
          searchInput: '',
          isSearchActive: false,
        },
        () => {
          this.filterProductsByCategory();
        }
      );
    },

    handlePublishItem() {
      if (!this.data.userInfo.company) {
        wx.showToast({
          title: '请完成认证后再发布物品',
          icon: 'none',
        });
        return;
      }
      navigateToPublishItem();
    },

    handleVerifyAuth() {
      navigateToAuth();
    },

    onEditProduct(e) {
      const product = e.currentTarget.dataset.product;
      this.setData({
        showingModal: 'edit-product',
        selectedProduct: product,
      });
    },

    handlePublishSimilarItem() {
      wx.navigateTo({
        url: `/pages/mall/publish-item/publish-item?id=${this.data.selectedProduct._id}&from=publish-similar-item`,
      });
      this.setData({
        showingModal: null,
      });
    },

    async handleDeleteProduct() {
      const { selectedProduct } = this.data;

      try {
        const result = await new Promise((resolve, reject) => {
          wx.showModal({
            title: '确认删除',
            content: '确定要删除这个商品吗？此操作不可恢复',
            confirmText: '确定删除',
            confirmColor: '#E64340',
            cancelText: '取消',
            success: (res) => resolve(res),
            fail: (error) => reject(error),
          });
        });

        if (result.confirm) {
          wx.showLoading({
            title: '正在删除...',
            mask: true,
          });

          try {
            await deleteUserProduct(selectedProduct._id);
            wx.showToast({
              title: '删除成功',
              icon: 'success',
            });
            this.fetchAllFleaMarketProducts();
          } catch (error) {
            wx.showToast({
              title: '删除失败',
              icon: 'error',
            });
            console.error('删除商品失败:', error);
          }
        }
      } catch (error) {
        console.error('操作失败:', error);
      } finally {
        wx.hideLoading();
        this.setData({
          showingModal: null,
        });
      }
    },

    async handleTakedownProduct() {
      const { selectedProduct } = this.data;

      try {
        const result = await new Promise((resolve, reject) => {
          wx.showModal({
            title: '确认下架',
            content: '确定要下架这个商品吗？下架后可以随时重新上架',
            confirmText: '确定下架',
            confirmColor: '#576B95',
            cancelText: '取消',
            success: (res) => resolve(res),
            fail: (error) => reject(error),
          });
        });

        if (result.confirm) {
          wx.showLoading({
            title: '正在下架...',
            mask: true,
          });

          try {
            await updateUserProduct(selectedProduct._id, {
              status: 'inactive',
            });

            wx.showToast({
              title: '下架成功',
              icon: 'success',
            });
            this.fetchAllFleaMarketProducts();
          } catch (error) {
            wx.showToast({
              title: '下架失败',
              icon: 'error',
            });
            console.error('下架商品失败:', error);
          }
        }
      } catch (error) {
        console.error('操作失败:', error);
      } finally {
        wx.hideLoading();
        this.setData({
          showingModal: null,
        });
      }
    },

    hideModal() {
      this.setData({
        showingModal: null,
      });
    },

    handlePopularProductClick(e) {
      const product = e.currentTarget.dataset.product;
      this.setData({
        showingModal: 'popular-product',
        selectedProduct: product,
      });
    },

    async handleViewFleaMarketProduct(e) {
      const product = e.currentTarget.dataset.product;

      this.setData({
        showingModal: 'flea-market-product',
        selectedProduct: product,
      });

      try {
        await updateWantedBy(product._id);
        const updatedProducts = await fetchAllFleaMarketProducts();
        if (updatedProducts?.data) {
          const processedData = updatedProducts.data.map((p) => ({
            ...p,
            formattedTime: formatTimeAgo(p.createdAt),
          }));

          this.setData({
            secondhandProducts: processedData,
            fleaMarketProducts: processedData,
            selectedProduct: processedData.find((p) => p._id === product._id),
          });
        }
      } catch (error) {
        console.error('Failed to update product view:', error);
      }
    },

    handleViewAllPopularProducts() {
      this.setData({
        showingModal: 'all-popular-products',
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

    previewProductPicture(e) {
      const product = e.currentTarget.dataset.product;
      wx.previewImage({
        urls: product.pictures,
      });
    },

    previewUserAvatar() {
      wx.previewImage({
        urls: [this.data.selectedProduct.user.avatarUrl],
      });
    },

    onSearchChanged(e) {
      const keyword = e.detail.value?.toLowerCase() || '';
      this.setData({
        searchInput: e.detail.value || '',
        selectedCategory: null, // Reset category selection during search
      });

      if (!keyword) {
        this.setData(
          {
            selectedCategory: 'New',
          },
          () => {
            this.filterProductsByCategory();
          }
        );
        return;
      }

      const { secondhandProducts } = this.data;
      const searchResults = secondhandProducts.filter((product) =>
        this.productMatchesSearch(product, keyword)
      );

      this.setData({
        fleaMarketProducts: searchResults,
      });
    },

    toggleSearchInput() {
      this.setData({
        isSearchActive: true,
        selectedCategory: null, // Reset category when entering search
      });
    },

    onSearchBlur() {
      if (!this.data.searchInput) {
        this.setData(
          {
            isSearchActive: false,
            selectedCategory: 'New',
          },
          () => {
            this.filterProductsByCategory();
          }
        );
      }
    },

    productMatchesSearch(product, keyword) {
      return (
        product.title?.toLowerCase().includes(keyword) ||
        product.description?.toLowerCase().includes(keyword) ||
        product.categories?.some((category) =>
          category.toLowerCase().includes(keyword)
        ) ||
        product.price?.toString().includes(keyword)
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
