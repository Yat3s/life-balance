import { formatDateTimeWithDotSeparator } from "../../../common/util";
import { getAppConfig } from "../../../repository/baseRepo";
import {
  deleteComment,
  fetchPartnerMerchant,
  postComment,
  updateComment,
} from "../../../repository/perkRepo";
import { navigateToAuth, navigateToProfile } from "../../router";

const app = getApp();

Page({
  /**
   * Page initial data
   */
  data: {},

  /**
   * Lifecycle function--Called when page load
   */
  onLoad(options) {
    const partnerMerchantId = options.id;
    const user = app.globalData.userInfo;
    const hasAuth = !!user?.company;
    this.setData({ partnerMerchantId, hasAuth });
    this.fetchPartnerMerchantDetail(partnerMerchantId);
    this.fetchMerchantCommentTemplates();
  },

  fetchMerchantCommentTemplates() {
    getAppConfig().then((config) => {
      const merchantCommentTemplatesData = config.merchantCommentTemplates;
      const positiveTemplates = merchantCommentTemplatesData.filter(
        (template) => template.type === "positive"
      );
      const negativeTemplates = merchantCommentTemplatesData.filter(
        (template) => template.type === "negative"
      );
      this.setData({
        positiveTemplates,
        negativeTemplates,
      });
    });
  },

  fetchPartnerMerchantDetail(partnerMerchantId) {
    fetchPartnerMerchant(partnerMerchantId).then((res) => {
      const partnerMerchantData = res.data[0];
      const partnerMerchantComments = partnerMerchantData.comments
        ? partnerMerchantData.comments
            .map((item) => ({
              ...item,
              createdAtStr: formatDateTimeWithDotSeparator(item.createdAt),
              isCurrentUserComment:
                item._openid === app.globalData.userInfo._openid,
            }))
            .sort((a, b) => {
              const dateA = new Date(a.updatedAt || a.createdAt);
              const dateB = new Date(b.updatedAt || b.createdAt);
              return dateB - dateA;
            })
        : [];

      const partnerMerchant = {
        ...partnerMerchantData,
        comments: partnerMerchantComments,
      };
      const markers = [
        {
          id: 1,
          latitude: partnerMerchant.location.latitude,
          longitude: partnerMerchant.location.longitude,
          width: 17,
          height: 25,
          callout: {
            content: partnerMerchant.name,
            color: "#000",
            fontSize: 12,
            borderRadius: 3,
            borderColor: "#000000",
            bgColor: "#fff",
            padding: 5,
            display: "ALWAYS",
            textAlign: "center",
          },
        },
      ];
      const points = [
        {
          latitude: partnerMerchant.location.latitude,
          longitude: partnerMerchant.location.longitude,
        },
      ];
      this.setData({ partnerMerchant, markers, points });
    });
  },

  onClickMapMarker(e) {
    const markerId = e.markerId;
    const marker = this.data.markers.find((item) => item.id === markerId);
    const partnerMerchant = this.data.partnerMerchant;
    wx.openLocation({
      latitude: marker.latitude,
      longitude: marker.longitude,
      name: partnerMerchant.name,
      address: partnerMerchant.location.address,
      scale: 16,
    });
  },

  onOpenLocation() {
    const { partnerMerchant } = this.data;
    wx.openLocation({
      latitude: partnerMerchant.location.latitude,
      longitude: partnerMerchant.location.longitude,
      name: partnerMerchant.name,
      address: partnerMerchant.location.address,
      scale: 16,
    });
  },

  onShowCommentModal() {
    const hasAuth = this.data.hasAuth;
    const selectedCommentTemplate = this.data.selectedCommentTemplate;
    const canSendComment = selectedCommentTemplate;

    if (!hasAuth) {
      this.setData({
        showingModal: "auth",
      });
      return;
    }

    this.setData({
      showingModal: "comment",
      canSendComment: !!canSendComment,
    });
  },

  onDismissModal() {
    this.setData({
      showingModal: null,
      canSendComment: false,
      selectedCommentTemplate: null,
      selectedComment: null,
    });
  },

  onSelectCommentTemplate(e) {
    const template = e.currentTarget.dataset.template;

    if (template === this.data.selectedCommentTemplate) {
      this.setData({
        selectedCommentTemplate: null,
      });
    } else {
      this.setData({
        selectedCommentTemplate: template,
      });
    }

    const canSendComment = this.data.selectedCommentTemplate;
    this.setData({
      canSendComment: !!canSendComment,
    });
  },

  goToAuth() {
    navigateToAuth();
  },

  onPostComment() {
    const partnerMerchantId = this.data.partnerMerchantId;
    const selectedCommentTemplate = this.data.selectedCommentTemplate;
    const user = app.globalData.userInfo;
    if (!selectedCommentTemplate) {
      wx.showToast({
        title: "请选择评论模板",
        icon: "none",
      });
      return;
    }
    this.onDismissModal();
    const comment = {
      avatarUrl: user.avatarUrl,
      nickName: user.nickName,
      content: selectedCommentTemplate,
    };
    postComment(partnerMerchantId, comment)
      .then((res) => {
        if (res.success) {
          wx.showToast({
            title: "评价成功",
            icon: "success",
          });
          this.fetchPartnerMerchantDetail(partnerMerchantId);
        } else {
          wx.showToast({
            title: "评价失败",
            icon: "none",
          });
        }
      })
      .catch((err) => {
        console.error(err);
        wx.showToast({
          title: "评价失败",
          icon: "none",
        });
      });
  },

  onGoProfile(e) {
    const userId = e.currentTarget.dataset.userId;
    navigateToProfile(userId);
  },

  onShowCommentActionSheet(e) {
    const comment = e.currentTarget.dataset.comment;
    this.setData({
      selectedComment: comment,
    });
    const isCurrentUserComment =
      comment._openid === app.globalData.userInfo._openid;
    if (!isCurrentUserComment) {
      return;
    }
    wx.showActionSheet({
      itemList: ["删除评价"],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.onDeleteComment();
        }
      },
    });
  },

  onDeleteComment() {
    const comment = this.data.selectedComment;
    const partnerMerchantId = this.data.partnerMerchantId;
    const commentInfo = {
      createdAt: comment.createdAt,
      _openid: comment._openid,
      content: comment.content,
    };
    wx.showLoading({
      title: "删除中...",
    });
    deleteComment(partnerMerchantId, commentInfo)
      .then((res) => {
        if (res.success) {
          wx.showToast({
            title: "删除成功",
            icon: "success",
          });
          this.fetchPartnerMerchantDetail(partnerMerchantId);
        } else {
          wx.showToast({
            title: "删除失败",
            icon: "none",
          });
        }
      })
      .catch((err) => {
        console.error(err);
        wx.showToast({
          title: "删除失败",
          icon: "none",
        });
      })
      .finally(() => {
        wx.hideLoading();
        this.onDismissModal();
      });
  },

  /**
   * Lifecycle function--Called when page is initially rendered
   */
  onReady() {},

  /**
   * Lifecycle function--Called when page show
   */
  onShow() {},

  /**
   * Lifecycle function--Called when page hide
   */
  onHide() {},

  /**
   * Lifecycle function--Called when page unload
   */
  onUnload() {},

  /**
   * Page event handler function--Called when user drop down
   */
  onPullDownRefresh() {},

  /**
   * Called when page reach bottom
   */
  onReachBottom() {},

  /**
   * Called when user click on the top right corner to share
   */
  onShareAppMessage() {},
});
