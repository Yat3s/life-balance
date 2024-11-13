import { DELIVERY_TYPE, ORDER_STATUS } from '../../../lib/constants';
import { formatDate, maskPhoneNumber } from '../../../lib/utils';
import { fetchOrder } from '../../../repository/orderRepo';

Page({
  data: {
    order: null,
  },

  async onLoad(options) {
    const orderId = options.id;

    if (orderId) {
      const config = await getAppConfig();
      const order = (await fetchOrder(orderId)).data[0];

      this.setData({
        contactNumber: config.contactNumber,
        contactName: config.contactName,
        pickUpLocation: config.pickUpLocation,
        order: {
          ...order,
          contactPhone: maskPhoneNumber(order.contactPhone),
          orderStatus: this.getOrderStatus(order.status),
          deliveryType: this.getDeliveryType(order.deliveryType),
          formattedTime: formatDate(order.paidAt),
        },
      });
    }
  },

  getDeliveryType(type) {
    switch (type) {
      case DELIVERY_TYPE.DELIVERY:
        return '快递配送';
      case DELIVERY_TYPE.SELF_PICKUP:
        return '自提';
      case DELIVERY_TYPE.WORKPLACE:
        return '送至工位';
      default:
        return '';
    }
  },

  getOrderStatus(status) {
    switch (status) {
      case ORDER_STATUS.UNPAID:
        return '待支付';
      case ORDER_STATUS.PENDING_DELIVERY:
        return '待发货';
      case ORDER_STATUS.DELIVERED:
        return '已发货';
      case ORDER_STATUS.COMPLETED:
        return '已完成';
      default:
        return '';
    }
  },

  navigateToHome() {
    wx.navigateBack({
      delta: 1,
    });
  },

  navigateToOrders() {
    wx.navigateTo({
      url: '/pages/user/user-product/user-product?tab=userOrders',
    });
  },
});
