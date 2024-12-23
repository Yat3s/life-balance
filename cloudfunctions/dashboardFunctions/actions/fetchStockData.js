const {
  isNasdaqTradingHours,
  cacheOperations,
  stockAPI,
} = require('../lib/stock-utils');

exports.main = async (event, context) => {
  const symbols = ['MSFT', 'AAPL', 'NVDA', 'GOOG'];

  try {
    const isTrading = isNasdaqTradingHours();
    let stocks = [];
    let dataSource = 'Alpha Vantage';
    let fromCache = false;

    const cachedData = await cacheOperations.get();

    if (isTrading) {
      try {
        for (const symbol of symbols) {
          const [quoteData, overviewData] = await Promise.all([
            stockAPI.fetchQuote(symbol),
            stockAPI.fetchCompanyOverview(symbol),
          ]);

          stocks.push({
            ...quoteData,
            ...overviewData,
          });

          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error('Error fetching real-time data:', error);
        if (cachedData) {
          stocks = cachedData.stocks;
          dataSource = 'Cache (Fallback)';
          fromCache = true;
        } else {
          throw error;
        }
      }
    } else {
      if (cachedData) {
        stocks = cachedData.stocks;
        dataSource = 'Cache';
        fromCache = true;
      } else {
        for (const symbol of symbols) {
          const [quoteData, overviewData] = await Promise.all([
            stockAPI.fetchQuote(symbol),
            stockAPI.fetchCompanyOverview(symbol),
          ]);

          stocks.push({
            ...quoteData,
            ...overviewData,
          });

          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }
    }

    if (stocks.length === 0) {
      throw new Error('No stock data retrieved');
    }

    stocks.sort((a, b) => parseFloat(b.mktcap) - parseFloat(a.mktcap));

    const top1 = stocks[0];
    const msft = stocks.find((stock) => stock.symbol === 'MSFT') || null;

    const responseData = {
      top1,
      msft: msft
        ? {
            ...msft,
            change: msft.formattedChange,
          }
        : null,
      stocks,
      timestamp: new Date().getTime(),
      dataSource,
    };

    if (!fromCache) {
      await cacheOperations.update(responseData);
    }

    return {
      code: 0,
      message: 'success',
      data: {
        ...responseData,
        fromCache,
      },
    };
  } catch (error) {
    console.error('Failed to fetch stock data:', error);
    return {
      code: -1,
      message: error.message || 'Failed to fetch stock data',
      data: null,
    };
  }
};
