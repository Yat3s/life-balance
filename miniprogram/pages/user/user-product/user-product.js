import { formatTimeAgo } from '../../../common/util';
import { fetchAllUserOrders } from '../../../repository/orderRepo';
import {
  fetchAllUserProducts,
  updateUserProduct,
} from '../../../repository/productRepo';
import { ORDER_STATUS } from '../../../lib/constants';

Page({
  data: {
    activeTab: 'userProducts',
    userProducts: null,
    userOrders: null,
    purchaseEnabled: false,
  },

  onLoad(options) {
    if (options.tab) {
      this.setData({
        activeTab: options.tab,
      });
    }
    this.fetchAllRecords();
  },

  onShow() {
    this.fetchAllRecords();
  },

  fetchAllRecords() {
    fetchAllUserProducts()
      .then((res) => {
        if (res) {
          const processedData = res.data.map((product) => ({
            ...product,
            formattedTime: formatTimeAgo(product.createdAt),
          }));
          this.setData({
            userProducts: processedData,
          });
        }
      })
      .catch((err) => {
        console.log(err);
      });
    fetchAllUserOrders()
      .then((res) => {
        const formattedOrders = res.data.map((order) => {
          const product = order.product;
          return {
            id: order._id,
            title: product.title,
            price: product.price,
            categories: product.categories,
            pictures: product.pictures,
            purchaseDate: this.formatDate(order.paidAt),
            totalFee: order.totalFee,
            productId: order.productId,
            status: this.getOrderStatus(order.status),
          };
        });

        this.setData({
          userOrders: formattedOrders,
        });
      })
      .catch((err) => {
        console.log('Failed to fetch orders:', err);
        wx.showToast({
          title: '获取订单失败',
          icon: 'error',
        });
      });
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

  formatDate(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      '0'
    )}-${String(date.getDate()).padStart(2, '0')}`;
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      activeTab: tab,
    });
  },

  toggleStatus(e) {
    const id = e.currentTarget.dataset.id;
    const products = [...this.data.userProducts];
    const index = products.findIndex((p) => p._id === id);

    if (index > -1) {
      const newStatus = products[index].saleStatus === 'on' ? 'off' : 'on';
      products[index].saleStatus = newStatus;

      this.setData({
        userProducts: products,
      });

      const updateUserProductData = {
        saleStatus: newStatus,
      };

      updateUserProduct(id, updateUserProductData)
        .then((res) => {
          if (res.success) {
            wx.showToast({
              title: newStatus === 'on' ? '上架成功' : '下架成功',
              icon: 'success',
            });
            this.fetchAllRecords();
            this.hideModal();
          } else {
            wx.showToast({
              title: 'Update failed',
              icon: 'error',
            });
            this.fetchAllRecords();
          }
        })
        .catch((err) => {
          console.error('Update failed:', err);
          wx.showToast({
            title: 'Update failed',
            icon: 'error',
          });
          this.fetchAllRecords();
        });
    }
  },

  editProduct(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/mall/publish-item/publish-item?id=${id}`,
    });
    this.hideModal();
  },

  viewOrder(e) {
    const orderId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/user/user-order/user-order?id=${orderId}&from=userOrders`,
    });
  },

  handleOpenProductModal(e) {
    const product = e.currentTarget.dataset.product;

    this.setData({
      showingModal: 'product',
      selectedProduct: product,
    });
  },

  hideModal() {
    this.setData({
      showingModal: null,
    });
  },

  previewProductPicture() {
    wx.previewImage({
      urls: this.data.selectedProduct.pictures,
    });
  },
});
