const {
  getStockData,
  cacheOperations,
  isNasdaqTradingHours,
} = require('../lib/stock-utils');

const SYMBOLS = ['MSFT', 'AAPL', 'NVDA', 'GOOG'];

exports.main = async () => {
  try {
    const [cachedData, isTrading] = await Promise.all([
      cacheOperations.get(),
      isNasdaqTradingHours(),
    ]);

    const { stocks, dataSource, fromCache } = await getStockData(
      SYMBOLS,
      isTrading,
      cachedData
    );

    if (!stocks || stocks.length === 0) {
      throw new Error('No stock data retrieved');
    }

    stocks.sort((a, b) => parseFloat(b.mktcap) - parseFloat(a.mktcap));
    const top1 = stocks[0];
    const msft = stocks.find((stock) => stock.symbol === 'MSFT');

    const responseData = {
      top1,
      msft: msft ? { ...msft, change: msft.formattedChange } : null,
      stocks,
      timestamp: Date.now(),
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
