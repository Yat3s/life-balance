import { fetchStockData } from "../../repository/dashboardRepo";

Component({
  options: {
    addGlobalClass: true,
  },
  /**
   * Component properties
   */
  properties: {},

  /**
   * Component initial data
   */
  data: {
    stockData: {
      msft: {
        price: "000.00",
        change: "0.00",
      },
      top1: {
        mktcap: "00.00",
      },
      top2: {
        mktcap: "00.00",
      },
      top3: {
        mktcap: "00.00",
      },
      top4: {
        mktcap: "00.00",
      },
    },
  },

  lifetimes: {
    attached() {
      fetchStockData().then((stockData) => {
        console.log("Stock data", stockData);

        const processMarketCap = (stock) => {
          stock.mktcap = (stock.mktcap / 1000000000000).toFixed(2);
          return stock;
        };

        const [top1, top2, top3, top4] = stockData.stocks;
        const msft = stockData.msft;

        stockData.msftTop1 = top1.symbol === "MSFT";
        stockData.top1 = processMarketCap(top1);
        stockData.top2 = processMarketCap(top2);
        stockData.top3 = processMarketCap(top3);
        stockData.top4 = processMarketCap(top4);
        stockData.msft = processMarketCap(msft);

        this.setData({
          stockData,
        });
      });
    },
  },

  /**
   * Component methods
   */
  methods: {},
});
