import { fetchOrder } from '../../../repository/orderRepo';

Page({
  data: {},

  async onLoad(options) {
    if (options.id) {
      const order = (await fetchOrder(options.id)).data[0];
      this.setData({
        order,
      });
    }
  },
});
