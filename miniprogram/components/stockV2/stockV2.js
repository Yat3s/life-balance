import { fetchStockData } from "../../repository/dashboardRepo";

Component({
  options: {
    addGlobalClass: true,
  },

  properties: {},

  data: {
    loadingStockData: true,
    stockData: {
      msft: {
        price: "000.00",
        change: "0.00",
      },
      msftTop1: false,
      top1: {
        symbol: "--",
        mktcap: "0.00",
      },
      top2: {
        symbol: "--",
        mktcap: "0.00",
      },
      top3: {
        symbol: "--",
        mktcap: "0.00",
      },
      top4: {
        symbol: "--",
        mktcap: "0.00",
      },
    },
  },

  lifetimes: {
    attached() {
      this.fetchAndProcessStockData();
    },
  },

  methods: {
    processMarketCap(stock) {
      if (!stock || !stock.mktcap) return stock;

      try {
        // Convert market cap from billions to trillions
        const mktCapNum = parseFloat(stock.mktcap.replace("B", ""));
        stock.mktcap = (mktCapNum / 1000).toFixed(2);
        return stock;
      } catch (error) {
        console.error("Error processing market cap data:", error);
        return { ...stock, mktcap: "0.00" };
      }
    },

    async fetchAndProcessStockData() {
      try {
        const response = await fetchStockData();

        if (!response || !response.data || !response.data.stocks) {
          throw new Error("Invalid stock data received");
        }

        const { stocks, msft } = response.data;

        if (stocks.length < 4) {
          throw new Error("Insufficient stock data");
        }

        // Process top 4 stocks market cap
        const [top1, top2, top3, top4] = stocks.map((stock) =>
          this.processMarketCap(stock)
        );
        const processedMsft = this.processMarketCap(msft);

        this.setData({
          loadingStockData: false,
          stockData: {
            msft: {
              price: processedMsft.price || "0.00",
              change: processedMsft.change || "0.00",
            },
            msftTop1: top1.symbol === "MSFT",
            top1: {
              symbol: top1.symbol,
              mktcap: top1.mktcap,
            },
            top2: {
              symbol: top2.symbol,
              mktcap: top2.mktcap,
            },
            top3: {
              symbol: top3.symbol,
              mktcap: top3.mktcap,
            },
            top4: {
              symbol: top4.symbol,
              mktcap: top4.mktcap,
            },
          },
        });
      } catch (error) {
        console.error("Failed to fetch stock data:", error);
      }
    },
  },
});
