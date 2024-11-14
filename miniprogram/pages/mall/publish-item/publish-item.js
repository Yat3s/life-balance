import { getAppConfig } from '../../../repository/baseRepo';
import {
  createProduct,
  fetchFleaMarketProduct,
  updateProduct,
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
    categories: [],
    categoriesWithSelection: [],
    selectedCategory: [],
    userInfo: null,
    productId: null,
  },

  async onLoad(options) {
    try {
      const config = await getAppConfig();
      const categories = config.fleaMarketKeywords || [];

      if (options.id) {
        const product = (await fetchFleaMarketProduct(options.id)).data[0];
        if (!product) {
          throw new Error('Product not found');
        }

        const categoriesWithSelection = categories.map((category) => ({
          name: category,
          isSelected: product.categories?.includes(category) || false,
        }));

        this.setData({
          productId: options.id,
          title: product.title || '',
          price: product.price?.toString() || '',
          description: product.description || '',
          pictures: product.pictures || [],
          isInternal: product.isInternal ?? true,
          contact: product.contact || '',
          categories,
          categoriesWithSelection,
          selectedCategory: product.categories || [],
        });
      } else {
        const categoriesWithSelection = categories.map((category) => ({
          name: category,
          isSelected: false,
        }));

        this.setData({
          categories,
          categoriesWithSelection,
          selectedCategory: [],
        });
      }

      const userInfo = await fetchUserInfo();
      if (userInfo) {
        this.setData({
          userInfo,
          isInternal: userInfo.company ? true : false,
          contact: this.data.contact || userInfo.contact,
        });
      }
    } catch (err) {
      console.error('Failed to initialize page:', err);
      wx.showToast({
        title: 'Failed to load data',
        icon: 'none',
      });
    }
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

    const categoriesWithSelection = this.data.categories.map((category) => ({
      name: category,
      isSelected: selectedCategory.includes(category),
    }));

    this.setData({
      selectedCategory,
      categoriesWithSelection,
    });
  },

  onIsInternalChange(e) {
    this.setData({ isInternal: e.detail.value });
  },

  onContactInput(e) {
    this.setData({ contact: e.detail.value });
  },

  onDescriptionInput(e) {
    this.setData({ description: e.detail.value });
  },

  validatePrice(price) {
    const numberPrice = Number(price);

    if (isNaN(numberPrice) || numberPrice <= 0) {
      wx.showToast({
        title: 'Please enter a valid price greater than 0',
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
      isInternal,
      selectedCategory,
      userInfo,
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
      title: productId ? 'Updating...' : 'Publishing...',
    });

    try {
      const productData = {
        title,
        price: validatedPrice,
        contact: finalContact,
        description: description || '',
        pictures: pictures || [],
        saleStatus: 'on',
        isInternal,
        categories: selectedCategory || [],
      };

      if (productId) {
        await updateProduct(productId, productData);
        wx.showToast({
          title: 'Update successfully!',
          icon: 'none',
        });
      } else {
        await createProduct(productData);
        wx.showToast({
          title: 'Publish successfully!',
          icon: 'none',
        });
      }

      wx.hideLoading();
      wx.navigateBack();
    } catch (err) {
      console.error(productId ? 'Update failed: ' : 'Publish failed: ', err);
      wx.hideLoading();
      wx.showToast({
        title: productId ? 'Update failed' : 'Publish failed',
        icon: 'none',
      });
    }
  },
});
