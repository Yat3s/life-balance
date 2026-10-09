import { fetchStockData } from "../../repository/dashboardRepo";

const STOCK_REQUEST_TIMEOUT = 12000;

Component({
  options: {
    addGlobalClass: true,
  },

  properties: {},

  data: {
    loadingStockData: true,
    hasStockData: false,
    stockDataError: false,
    usingCachedData: false,
    stockUpdatedAt: "",
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
      this._stockDetached = false;
      this.fetchAndProcessStockData();
    },
    detached() {
      this._stockDetached = true;
      clearTimeout(this._stockTimeout);
    },
  },

  methods: {
    processMarketCap(stock) {
      if (!stock || !/^\d+(?:\.\d+)?B$/.test(stock.mktcap) ||
          !Number.isFinite(parseFloat(stock.mktcap)) || parseFloat(stock.mktcap) <= 0) {
        throw new Error("Invalid market cap");
      }
      return { ...stock, mktcap: (parseFloat(stock.mktcap) / 1000).toFixed(2) };
    },

    async fetchAndProcessStockData() {
      if (this._stockLoading || this._stockDetached) return;
      this._stockLoading = true;
      this.setData({ loadingStockData: true, stockDataError: false });
      try {
        const timeout = new Promise((_, reject) => {
          this._stockTimeout = setTimeout(() => reject(new Error("Stock request timed out")), STOCK_REQUEST_TIMEOUT);
        });
        const response = await Promise.race([fetchStockData(), timeout]);
        if (this._stockDetached) return;

        if (!response || response.code !== 0 || !Array.isArray(response.data?.stocks)) {
          throw new Error("Invalid stock data received");
        }

        const { stocks, msft } = response.data;

        if (stocks.length < 4 || new Set(stocks.map((stock) => stock?.symbol)).size < 4) {
          throw new Error("Insufficient stock data");
        }

        // Process top 4 stocks market cap
        const [top1, top2, top3, top4] = stocks.map((stock) =>
          this.processMarketCap(stock)
        );
        const processedMsft = this.processMarketCap(msft);
        const change = processedMsft.formattedChange || processedMsft.change;
        if (processedMsft.symbol !== "MSFT" || !Number.isFinite(Number(processedMsft.price)) ||
            Number(processedMsft.price) <= 0 || !/^[+-]?\d+(?:\.\d+)?$/.test(change)) {
          throw new Error("Invalid Microsoft quote");
        }
        const updatedAt = new Date(response.data.timestamp);
        const stockUpdatedAt = Number.isFinite(updatedAt.getTime())
          ? `${updatedAt.getMonth() + 1}/${updatedAt.getDate()}` : "上次数据";

        this.setData({
          hasStockData: true,
          usingCachedData: response.data.stale === true,
          stockUpdatedAt,
          stockData: {
            msft: {
              price: processedMsft.price,
              change,
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
        if (!this._stockDetached) this.setData({ stockDataError: true });
      } finally {
        clearTimeout(this._stockTimeout);
        this._stockLoading = false;
        if (!this._stockDetached) this.setData({ loadingStockData: false });
      }
    },
  },
});
