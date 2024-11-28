import { addCircle } from "../../../repository/circleRepo";

Page({
  data: {
    tags: [],
    citys: [],
    isEdit: false,
    tagsInput: "",
    cityInput: "",
  },
  onLoad(options) {},
  onNameInput(e) {
    this.setData({ name: e.detail.value });
  },
  onTagsInput(e) {
    const tags = e.detail.value
      .split(/,|，/)
      .map((tag) => tag.trim())
      .filter((tag) => tag);
    this.setData({ tagsInput: e.detail.value, tags });
  },
  onCityInput(e) {
    const citys = e.detail.value
      .split(/,|，/)
      .map((city) => city.trim())
      .filter((city) => city);
    this.setData({ cityInput: e.detail.value, citys });
  },
  onDescriptionInput(e) {
    const description = `<p>${e.detail.value}</p>`;
    this.setData({ descriptionInput: e.detail.value, description });
  },

  uploadImage(tempFiles) {
    return new Promise((resolve, reject) => {
      wx.cloud.uploadFile({
        cloudPath: `circle/cover-${new Date().getTime()}.png`,
        filePath: tempFiles[0].tempFilePath,
        success: (res) => {
          resolve(res.fileID);
        },
        fail: (err) => {
          reject(err);
        },
      });
    });
  },
  uploadCover() {
    const that = this;
    wx.chooseMedia({
      count: 1,
      mediaType: ["image"],
      sizeType: ["original"],
      sourceType: ["album", "camera"],
      camera: "back",
      success(res) {
        const tempFiles = res.tempFiles;
        that
          .uploadImage(tempFiles)
          .then((fileID) => {
            that.setData({ coverFileId: fileID });
          })
          .catch((err) => {
            wx.showToast({
              title: "图片上传失败",
              icon: "none",
            });
          });
      },
    });
  },

  onRemoveImage() {
    this.setData({ coverFileId: null });
  },

  onCancel() {
    wx.navigateBack();
  },

  onCopyWechat() {
    wx.setClipboardData({
      data: "4645643",
    });
  },

  onCheckForm() {
    const { name, tags, description, coverFileId } = this.data;
    if (!name || tags.length === 0 || !description) {
      wx.showToast({
        title: "请填写所有必填字段",
        icon: "none",
      });
      return false;
    }
    if (!coverFileId) {
      wx.showToast({
        title: "请上传封面图",
        icon: "none",
      });
      return false;
    }
    return true;
  },

  onSubmit() {
    if (!this.onCheckForm()) {
      return;
    }
    this.setData({ showingModal: "addCircle" });
  },

  onAddCircle() {
    const { name, tags, citys, description, coverFileId } = this.data;

    if (!this.onCheckForm()) {
      return;
    }

    wx.showLoading({
      title: "提交中...",
    });

    const addCircleData = {
      name,
      tags,
      citys: citys || [],
      intro: description,
      coverPic: coverFileId,
    };

    addCircle(addCircleData)
      .then(() => {
        wx.showToast({
          title: "提交成功",
          icon: "none",
        });
        wx.navigateBack();
      })
      .catch((err) => {
        wx.showToast({
          title: "提交失败",
          icon: "none",
        });
      })
      .finally(() => {
        wx.hideLoading();
      });
  },

  onDismissModal() {
    this.setData({
      showingModal: "",
    });
  },
});
