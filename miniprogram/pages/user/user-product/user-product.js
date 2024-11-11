import {
  fetchAllUserProducts,
  updateProduct,
} from '../../../repository/productRepo';

Page({
  data: {
    activeTab: 'published',
    purchasedProducts: [],
  },

  onLoad() {
    this.fetchAllRecords();
  },

  onShow() {
    this.fetchAllRecords();
  },

  fetchAllRecords() {
    fetchAllUserProducts()
      .then((res) => {
        this.setData({
          userProducts: res.data,
        });
      })
      .catch((err) => {
        console.log(err);
      });
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

      const updateProductData = {
        saleStatus: newStatus,
      };

      updateProduct(id, updateProductData)
        .then((res) => {
          if (res.success) {
            wx.showToast({
              title: newStatus === 'on' ? '上架成功' : '下架成功',
              icon: 'success',
            });
            this.fetchAllRecords();
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
  },

  deleteOrder(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '提示',
      content: '确定要删除这个订单吗？',
      success: (res) => {
        if (res.confirm) {
          const orders = this.data.purchasedProducts.filter((p) => p.id !== id);
          this.setData({
            purchasedProducts: orders,
          });
        }
      },
    });
  },
});