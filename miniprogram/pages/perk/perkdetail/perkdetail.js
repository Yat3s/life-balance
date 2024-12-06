import { formatDateWithDotSeparator } from "../../../common/util";
import { fetchPartnerMerchant } from "../../../repository/perkRepo";

Page({
  /**
   * Page initial data
   */
  data: {},

  /**
   * Lifecycle function--Called when page load
   */
  onLoad(options) {
    console.log("options", options);
    const partnerMerchantId = options.id;
    this.setData({ partnerMerchantId });
    this.fetchPartnerMerchantDetail(partnerMerchantId);
  },

  fetchPartnerMerchantDetail(partnerMerchantId) {
    fetchPartnerMerchant(partnerMerchantId).then((res) => {
      const partnerMerchantData = res.data[0];
      const partnerMerchantComments = partnerMerchantData.comments.map(
        (item) => ({
          ...item,
          createdAtStr: formatDateWithDotSeparator(item.createdAt),
        })
      );
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
