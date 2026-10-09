const {
  getStockData,
  cacheOperations,
} = require('./lib/stock-utils');

const SYMBOLS = ['MSFT', 'AAPL', 'NVDA', 'GOOG'];

exports.main = async () => {
  try {
    const cachedData = await cacheOperations.get();
    const result = await getStockData(SYMBOLS, cachedData);
    const { dataSource, fromCache, stale, timestamp } = result;
    const stocks = [...result.stocks];

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
      timestamp,
      dataSource,
      stale,
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
