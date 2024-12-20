import { fetchUserInfo, updateUserInfo } from "../../repository/userRepo";
const app = getApp();

Component({
  options: {
    addGlobalClass: true,
    multipleSlots: true,
  },
  properties: {
    show: {
      type: Boolean,
      value: false,
    },
  },
  data: {
    avatarChanged: false,
    avatarTmpUrl: "",
    nickName: "",
  },

  lifetimes: {
    attached() {
      fetchUserInfo().then((res) => {
        this.setData({
          userId: res._id,
        });
      });
    },
  },

  methods: {
    resetForm() {
      this.setData({
        avatarChanged: false,
        avatarTmpUrl: "",
        nickName: "",
      });
    },

    onClose() {
      this.resetForm();
      this.triggerEvent("close");
    },

    onChooseAvatar(e) {
      const { avatarUrl } = e.detail;
      console.log("Avatar URL: ", avatarUrl);
      this.setData({
        avatarTmpUrl: avatarUrl,
        avatarChanged: true,
      });
    },

    onNickNameChange(e) {
      this.setData({
        nickName: e.detail.value,
      });
    },

    async onFormSubmit(e) {
      const { nickName } = e.detail.value;
      const { avatarChanged, avatarTmpUrl } = this.data;

      if (!nickName) {
        wx.showToast({
          icon: "none",
          title: "请输入你的昵称",
        });
        return;
      }

      if (avatarChanged && !avatarTmpUrl) {
        wx.showToast({
          icon: "none",
          title: "请选择你的头像",
        });
        return;
      }

      wx.showLoading({
        title: "更新中...",
      });

      try {
        let updateData = { nickName };

        if (avatarChanged) {
          const uploadResult = await wx.cloud.uploadFile({
            cloudPath: `avatars/${Date.now()}-${Math.floor(
              Math.random() * 1000
            )}.png`,
            filePath: avatarTmpUrl,
          });
          updateData.avatarUrl = uploadResult.fileID;
        }

        const res = await updateUserInfo(this.data.userId, updateData);

        wx.hideLoading();
        wx.showToast({
          title: "更新成功",
          icon: "success",
        });

        app.globalData.userInfo = res;
        this.onClose();
      } catch (error) {
        wx.hideLoading();
        wx.showToast({
          title: error.message || "操作失败，请重试",
          icon: "error",
        });
      }
    },
  },
});
