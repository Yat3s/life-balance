import { getAppConfig } from '../../../repository/baseRepo';
import {
  createUserProduct,
  fetchFleaMarketProduct,
  updateUserProduct,
} from '../../../repository/productRepo';
import { fetchUserInfo } from '../../../repository/userRepo';

const app = getApp();
const MAX_APP_BAR_HEIGHT = 150; //px

Page({
  data: {
    toolbarHeight: app.globalData.toolbarHeight,
    statusBarHeight: app.globalData.statusBarHeight,
    appBarHeight: MAX_APP_BAR_HEIGHT,
    pictures: [],
    fleaMarketKeywords: [],
    userInfo: null,
    productId: null,
    productType: 'sell',
  },

  async onLoad(options) {
    try {
      const [fleaMarketKeywords, userInfo] = await Promise.all([
        this.getFleaMarketKeywords(),
        fetchUserInfo(),
      ]);

      if (options.id) {
        const isPublishSimilar = options.from === 'publish-similar-item';
        await this.loadProductData(
          options.id,
          fleaMarketKeywords,
          userInfo,
          isPublishSimilar
        );
      } else {
        await this.initializeNewProduct(fleaMarketKeywords, userInfo);
      }
    } catch (err) {
      console.error('Failed to initialize page:', err);
      wx.showToast({
        title: 'Failed to load data',
        icon: 'none',
      });
    }
  },

  async getFleaMarketKeywords() {
    const config = await getAppConfig();
    return config.mall.fleaMarketKeywords || [];
  },

  async loadProductData(
    productId,
    fleaMarketKeywords,
    userInfo,
    isPublishSimilar
  ) {
    const product = (await fetchFleaMarketProduct(productId)).data[0];
    if (!product) {
      throw new Error('Product not found');
    }

    const categories = fleaMarketKeywords.map((category) => ({
      name: category,
      isSelected: product.categories?.includes(category) || false,
    }));

    this.setData({
      productId: isPublishSimilar ? null : productId,
      title: product.title || '',
      price: product.price?.toString() || '',
      description: product.description || '',
      pictures: isPublishSimilar ? [] : product.pictures || [],
      contact: isPublishSimilar ? userInfo?.contact : product.contact || '',
      fleaMarketKeywords,
      categories,
      selectedCategory: product.categories || [],
      productType: product.type || 'sell',
      userInfo,
    });
  },

  async initializeNewProduct(fleaMarketKeywords, userInfo) {
    const categories = fleaMarketKeywords.map((category, index) => ({
      name: category,
      isSelected: index === 0,
    }));

    this.setData({
      fleaMarketKeywords,
      categories,
      selectedCategory:
        fleaMarketKeywords.length > 0 ? [fleaMarketKeywords[0]] : [],
      userInfo,
      isInternal: userInfo?.company ?? false,
      contact: userInfo?.contact || '',
    });
  },

  onTypeChange(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      productType: type,
    });
  },

  onTitleInput(e) {
    this.setData({ title: e.detail.value });
  },

  onPriceInput(e) {
    const value = e.detail.value.replace(/[^\d.]/g, '');
    const parts = value.split('.');
    const formatted = parts.length > 2 ? `${parts[0]}.${parts[1]}` : value;
    this.setData({ price: formatted });
  },

  onCategorySelect(e) {
    const category = e.currentTarget.dataset.category;
    const selectedCategory = [category];

    const categories = this.data.fleaMarketKeywords.map((category) => ({
      name: category,
      isSelected: selectedCategory.includes(category),
    }));

    this.setData({
      selectedCategory,
      categories,
    });
  },

  onContactInput(e) {
    this.setData({ contact: e.detail.value });
  },

  onDescriptionInput(e) {
    this.setData({ description: e.detail.value });
  },

  validatePrice(price) {
    const numberPrice = Number(price);

    if (isNaN(numberPrice) || numberPrice < 0) {
      wx.showToast({
        title: 'Please enter a valid price',
        icon: 'none',
      });
      return null;
    }

    if (price.includes('.') && price.split('.')[1].length > 2) {
      wx.showToast({
        title: 'Price can only have up to 2 decimal places',
        icon: 'none',
      });
      return null;
    }

    return numberPrice;
  },

  onAddImage() {
    const that = this;
    wx.chooseMedia({
      count: 9 - that.data.pictures.length,
      mediaType: ['image'],
      sizeType: ['original'],
      sourceType: ['album', 'camera'],
      maxDuration: 30,
      camera: 'back',
      success(res) {
        const tempFiles = res.tempFiles;
        that.uploadMultipleImages(tempFiles);
      },
    });
  },

  onRemoveImage(e) {
    const index = e.currentTarget.dataset.index;
    const pictures = [...this.data.pictures];
    pictures.splice(index, 1);
    this.setData({
      pictures,
    });
  },

  uploadMultipleImages(tempFiles) {
    const uploadPromises = tempFiles.map((file, index) => {
      return new Promise((resolve, reject) => {
        wx.cloud.uploadFile({
          cloudPath: `products/${Date.now()}_${index}.png`,
          filePath: file.tempFilePath,
          success: (res) => {
            resolve({ url: res.fileID });
          },
          fail: (err) => {
            reject(err);
          },
        });
      });
    });

    Promise.all(uploadPromises)
      .then((results) => {
        const uploadedUrls = results.map((result) => result.url);
        this.setData({
          pictures: [...this.data.pictures, ...uploadedUrls],
        });
      })
      .catch((err) => {
        console.error('Image upload failed: ', err);
        wx.showToast({
          title: 'Image upload failed',
          icon: 'none',
        });
      });
  },

  onCancel() {
    wx.navigateBack();
  },

  async onPublish() {
    const {
      productId,
      title,
      price,
      contact,
      pictures,
      description,
      selectedCategory,
      userInfo,
      productType,
    } = this.data;

    if (!title) {
      wx.showToast({
        title: 'Please enter a title',
        icon: 'none',
      });
      return;
    }

    const validatedPrice = this.validatePrice(price);
    if (validatedPrice === null) {
      return;
    }

    let finalContact = contact;
    if (!finalContact && userInfo) {
      finalContact = userInfo.contact;
    }

    wx.showLoading({
      title: productId ? '保存中...' : '发布中...',
    });

    try {
      const productData = {
        title,
        type: productType,
        price: validatedPrice,
        contact: finalContact,
        description: description || '',
        pictures: pictures || [],
        categories: selectedCategory || [],
        ...(!productId && { status: 'on' }),
      };

      if (productId) {
        await updateUserProduct(productId, productData);
        wx.showToast({
          title: 'Update successfully!',
          icon: 'none',
        });
      } else {
        await createUserProduct(productData);
        wx.showToast({
          title: 'Publish successfully!',
          icon: 'none',
        });
      }

      wx.hideLoading();
      wx.navigateBack();
    } catch (err) {
      console.error('Operation failed: ', err);
      wx.hideLoading();
      wx.showToast({
        title: 'Operation failed',
        icon: 'none',
      });
    }
  },
});
