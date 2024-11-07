import { getAppConfig } from '../../../repository/baseRepo';
import { createItem } from '../../../repository/productRepo';
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
  },

  onLoad() {
    this.initData();
  },

  onShow() {
    this.initData();
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
    getAppConfig().then((config) => {
      const categories = config.fleaMarketKeywords || [];

      const categoriesWithSelection = categories.map((category) => ({
        name: category,
        isSelected: false,
      }));

      this.setData({
        categories,
        categoriesWithSelection,
      });
    });
  },

  onTitleInput(e) {
    this.setData({ title: e.detail.value });
  },

  onPriceInput(e) {
    this.setData({ price: e.detail.value });
  },

  onCategorySelect(e) {
    const category = e.currentTarget.dataset.category;
    let selectedCategory = this.data.selectedCategory;

    if (!Array.isArray(selectedCategory)) {
      selectedCategory = [];
    }

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
    let pictures = this.data.pictures;
    pictures.splice(index, 1);
    this.setData({
      pictures: pictures,
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
      });
  },

  onCancel() {
    wx.navigateBack();
  },

  onPublish() {
    let {
      title,
      price,
      contact,
      pictures,
      description,
      isStaffOnly,
      selectedCategory,
    } = this.data;

    if (!title) {
      wx.showToast({
        title: '请输入标题',
        icon: 'none',
      });
      return;
    }
    if (!price) {
      wx.showToast({
        title: '请输入正确的价格',
        icon: 'none',
      });
      return;
    }
    if (!contact) {
      contact = userInfo.contact;
    }

    wx.showLoading({
      title: 'Publishing...',
    });

    const createItemData = {
      title,
      price,
      contact,
      description: description ?? '',
      pictures: pictures ?? [],
      saleStatus: 'on',
      isStaffOnly,
      type: 'secondhand',
      categories: selectedCategory || [],
    };

    createItem(createItemData).then((res) => {
      wx.showToast({
        title: 'Publish successfully!',
        icon: 'none',
      });
      wx.navigateBack();
    });
  },
});
