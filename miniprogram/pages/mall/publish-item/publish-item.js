import { getAppConfig } from '../../../repository/baseRepo';
import { createProduct } from '../../../repository/productRepo';
import { fetchUserInfo } from '../../../repository/userRepo';

const app = getApp();
const MAX_APP_BAR_HEIGHT = 150; //px

Page({
  data: {
    isStaffOnly: true,
    toolbarHeight: app.globalData.toolbarHeight,
    statusBarHeight: app.globalData.statusBarHeight,
    appBarHeight: MAX_APP_BAR_HEIGHT,
    pictures: [],
    categories: [],
    categoriesWithSelection: [],
    selectedCategory: [],
    userInfo: null,
    contact: '',
  },

  onLoad() {
    this.initData();
  },

  onShow() {
    if (!this.data.categories.length) {
      this.initData();
    }
  },

  initData() {
    fetchUserInfo().then((userInfo) => {
      if (userInfo) {
        this.setData({
          userInfo,
          contact: userInfo.contact,
        });
      }
    });

    if (!this.data.categories.length) {
      getAppConfig().then((config) => {
        const categories = config.fleaMarketKeywords || [];

        const categoriesWithSelection = categories.map((category) => ({
          name: category,
          isSelected: false,
        }));

        this.setData({
          categories,
          categoriesWithSelection,
          selectedCategory: [],
        });
      });
    }
  },

  onTitleInput(e) {
    this.setData({ title: e.detail.value });
  },

  onPriceInput(e) {
    this.setData({ price: e.detail.value });
  },

  onCategorySelect(e) {
    const category = e.currentTarget.dataset.category;
    let selectedCategory = [...this.data.selectedCategory];

    if (selectedCategory.includes(category)) {
      selectedCategory = selectedCategory.filter((item) => item !== category);
    } else {
      selectedCategory.push(category);
    }

    const categoriesWithSelection = this.data.categories.map((category) => ({
      name: category,
      isSelected: selectedCategory.includes(category),
    }));

    this.setData({
      selectedCategory,
      categoriesWithSelection,
    });
  },

  onStaffOnlyChange(e) {
    this.setData({ isStaffOnly: e.detail.value });
  },

  onContactInput(e) {
    this.setData({ contact: e.detail.value });
  },

  onDescriptionInput(e) {
    this.setData({ description: e.detail.value });
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

  onPublish() {
    const {
      title,
      price,
      contact,
      pictures,
      description,
      isStaffOnly,
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
    if (!price) {
      wx.showToast({
        title: 'Please enter a valid price',
        icon: 'none',
      });
      return;
    }

    let finalContact = contact;
    if (!finalContact && userInfo) {
      finalContact = userInfo.contact;
    }

    wx.showLoading({
      title: 'Publishing...',
    });

    const createProductData = {
      title,
      price,
      contact: finalContact,
      description: description ?? '',
      pictures: pictures ?? [],
      saleStatus: 'on',
      isStaffOnly,
      type: 'secondhand',
      categories: selectedCategory || [],
    };

    createProduct(createProductData)
      .then(() => {
        wx.showToast({
          title: 'Publish successfully!',
          icon: 'none',
        });
        wx.navigateBack();
      })
      .catch((err) => {
        console.error('Publish failed: ', err);
        wx.showToast({
          title: 'Publish failed',
          icon: 'none',
        });
      });
  },
});
