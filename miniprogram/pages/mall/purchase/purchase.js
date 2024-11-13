import { fetchProduct } from '../../../repository/productRepo';
import { createOrder, updateOrder } from '../../../repository/orderRepo';
import { getAppConfig } from '../../../repository/baseRepo';
import { fetchUserInfo } from '../../../repository/userRepo';
import { ORDER_STATUS, DELIVERY_TYPE } from '../../../lib/constants';

Page({
  data: {
    product: null,
    deliveryType: DELIVERY_TYPE.SELF_PICKUP,
    workplace: '',
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
        pickUpLocation: config.pickUpLocation ?? '微软大厦 5F #65',
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

  onWorkplaceInput(e) {
    this.setData({
      workplace: e.detail.value,
    });
  },

  onAddressInput(e) {
    this.setData({
      address: e.detail.value,
    });
  },

  validateDeliveryInfo() {
    const { deliveryType, address, phoneNumber, workplace } = this.data;

    if (deliveryType === DELIVERY_TYPE.DELIVERY) {
      if (!address.trim()) {
        wx.showToast({
          title: '请填写收货地址',
          icon: 'none',
        });
        return false;
      }
    }

    if (deliveryType === DELIVERY_TYPE.WORKPLACE) {
      if (!workplace.trim()) {
        wx.showToast({
          title: '请填写工位号',
          icon: 'none',
        });
        return false;
      }
    }

    if (
      deliveryType !== DELIVERY_TYPE.SELF_PICKUP &&
      (!phoneNumber || phoneNumber.length !== 11)
    ) {
      wx.showToast({
        title: '请输入正确的手机号',
        icon: 'none',
      });
      return false;
    }

    return true;
  },

  async onPaymentConfirm() {
    if (!this.validateDeliveryInfo()) {
      return;
    }

    const { product, deliveryType, address, phoneNumber, workplace } =
      this.data;

    try {
      const orderData = {
        deliveryType,
        status: ORDER_STATUS.PENDING_PAYMENT,
      };

      const order = await createOrder(product._id, orderData);
      const { payment, orderId, totalFee } = order;

      const updateOrderData = {
        paid: totalFee,
        ...(deliveryType === DELIVERY_TYPE.DELIVERY && {
          address,
          contactPhone: phoneNumber,
          trackingNumber: '',
        }),
        ...(deliveryType === DELIVERY_TYPE.WORKPLACE && {
          workplace,
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
          wx.navigateTo({
            url: `/pages/user/user-order/user-order?id=${orderId}&from=paySuccess`,
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
