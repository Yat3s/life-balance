import { fetchProduct } from '../../../repository/productRepo';
import { createOrder, updateOrder } from '../../../repository/orderRepo';

Page({
  data: {
    product: null,
    deliveryType: 'pickup',
    deliveryAddress: '',
    phoneNumber: '',
    contactName: '',
  },

  async onLoad(options) {
    if (options.id) {
      const product = (await fetchProduct(options.id)).data[0];
      this.setData({
        product,
        contactPhone: '4645643',
        contactName: 'Chris Ye',
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

  onDeliveryAddressInput(e) {
    this.setData({
      deliveryAddress: e.detail.value,
    });
  },

  validateDeliveryInfo() {
    const { deliveryType, deliveryAddress, phoneNumber } = this.data;

    if (deliveryType === 'delivery') {
      if (!deliveryAddress.trim()) {
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

    const { product, deliveryType, deliveryAddress, phoneNumber } = this.data;

    try {
      const orderData = {
        deliveryType,
        ...(deliveryType === 'delivery' && {
          deliveryAddress,
          contactPhone: phoneNumber,
        }),
      };

      const order = await createOrder(product._id, orderData);
      const { payment, orderId, totalFee } = order;

      wx.requestPayment({
        ...payment,
        success: () => {
          updateOrder(orderId, totalFee);
          wx.showToast({
            title: '支付成功',
            icon: 'success',
          });
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
