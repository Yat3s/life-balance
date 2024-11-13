import { fetchProduct } from '../../../repository/productRepo';
import { createOrder, updateOrder } from '../../../repository/orderRepo';
import { getAppConfig } from '../../../repository/baseRepo';
import { fetchUserInfo } from '../../../repository/userRepo';
import { navigateToUserOrder } from '../../router';
import { ORDER_STATUS } from '../../../lib/constants';

Page({
  data: {
    product: null,
    deliveryType: 'pickup',
  },

  async onLoad(options) {
    if (options.id) {
      const product = (await fetchProduct(options.id)).data[0];
      const config = await getAppConfig();
      const userInfo = await fetchUserInfo();
      this.setData({
        product,
        contactNumber: config.contactNumber ?? '4645643',
        contactName: config.contactName ?? 'Chris Ye',
        phoneNumber: userInfo.phoneNumber ?? '',
        address: userInfo.address ?? '',
      });
    }
  },

  onDeliveryTypeChange(e) {
    const deliveryType = e.currentTarget.dataset.type;
    this.setData({ deliveryType });
  },

  onPhoneNumberInput(e) {
    const phoneNumber = e.detail.value.replace(/\D/g, '').slice(0, 11);
    this.setData({ phoneNumber });
  },

  onAddressInput(e) {
    this.setData({
      address: e.detail.value,
    });
  },

  validateDeliveryInfo() {
    const { deliveryType, address, phoneNumber } = this.data;

    if (deliveryType === 'delivery') {
      if (!address.trim()) {
        wx.showToast({
          title: '请填写收货地址',
          icon: 'none',
        });
        return false;
      }

      if (!phoneNumber || phoneNumber.length !== 11) {
        wx.showToast({
          title: '请输入正确的手机号',
          icon: 'none',
        });
        return false;
      }
    }

    return true;
  },

  async onPaymentConfirm() {
    if (!this.validateDeliveryInfo()) {
      return;
    }

    const { product, deliveryType, address, phoneNumber } = this.data;

    try {
      const orderData = {
        deliveryType,
        status: ORDER_STATUS.PENDING_PAYMENT,
      };

      const order = await createOrder(product._id, orderData);
      const { payment, orderId, totalFee } = order;

      const updateOrderData = {
        paid: totalFee,
        ...(deliveryType === 'delivery' && {
          address,
          contactPhone: phoneNumber,
        }),
      };

      wx.requestPayment({
        ...payment,
        success: async () => {
          await updateOrder(orderId, updateOrderData);
          wx.showToast({
            title: '支付成功',
            icon: 'success',
          });
          navigateToUserOrder(orderId);
        },
        fail: () => {
          wx.showToast({
            title: '支付失败，请重试',
            icon: 'none',
          });
        },
      });
    } catch (error) {
      wx.showToast({
        title: '创建订单失败，请重试',
        icon: 'none',
      });
    }
  },
});
