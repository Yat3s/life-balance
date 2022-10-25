import { fetchStockData } from "../../repository/dashboardRepo"

// components/stock/stock.js
Component({
  options: {
    addGlobalClass: true,
  },
  /**
   * 组件的属性列表
   */
  properties: {
    
  },

  /**
   * 组件的初始数据
   */
  data: {
    stockData: {
      msft: {
        price: "000.00",
        change: "0.00"
      },
    }
  },

  lifetimes: {
    attached() {
      fetchStockData().then(stockData => {
        const top1 = stockData.stocks[0];
        const top2 = stockData.stocks[1];
        const msft = stockData.msft;
        top1.mktcap = (top1.mktcap / 1000000000000).toFixed(2);
        top2.mktcap = (top2.mktcap / 1000000000000).toFixed(2);
        msft.mktcap = (msft.mktcap / 1000000000000).toFixed(2);
        msft.price = msft.price;
        stockData.msftTop1 = top1.symbol === 'MSFT';
        stockData.top1 = top1;
        stockData.top2 = top2;
        stockData.msft = msft;
        this.setData({
          stockData
        });
      });
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {

  }
})
