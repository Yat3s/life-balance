const cloud = require('wx-server-sdk');
const rp = require('request-promise');

const API_KEY = 'WEQGVELPMJ086QXP';
const BASE_URL = 'https://www.alphavantage.co/query';
const CACHE_TIME = 5 * 60 * 1000; // 5 minutes cache

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

async function withRetry(fn, retries = 3, delay = 2000) {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return withRetry(fn, retries - 1, delay * 1.5);
  }
}

async function getCache(key) {
  try {
    const db = cloud.database();
    const result = await db
      .collection('stockCache')
      .where({
        key,
        timestamp: cloud.database().command.gt(Date.now() - CACHE_TIME),
      })
      .limit(1)
      .get();

    return result.data[0];
  } catch (error) {
    console.error('Cache read error:', error);
    return null;
  }
}

async function setCache(key, data) {
  try {
    const db = cloud.database();
    const existing = await getCache(key);

    if (existing) {
      await db
        .collection('stockCache')
        .doc(existing._id)
        .update({
          data: {
            data,
            timestamp: Date.now(),
          },
        });
    } else {
      await db.collection('stockCache').add({
        data: {
          key,
          data,
          timestamp: Date.now(),
        },
      });
    }
  } catch (error) {
    console.error('Cache write error:', error);
  }
}

async function getStockQuote(symbol) {
  const cacheKey = `quote_${symbol}`;

  // Try to get from cache first
  const cached = await getCache(cacheKey);
  if (cached) {
    return cached.data;
  }

  // If not in cache, fetch from API with retry
  const fetchQuote = async () => {
    const option = {
      uri: `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`,
      json: true,
      timeout: 5000, // 5s timeout
    };

    const response = await rp.get(option);
    const quote = response['Global Quote'];

    if (!quote || !quote['05. price']) {
      throw new Error(`Failed to get data for ${symbol}`);
    }

    const data = {
      symbol,
      price: parseFloat(quote['05. price']).toFixed(2),
      change: parseFloat(quote['09. change']).toFixed(2),
      changePercent: quote['10. change percent'].replace('%', '') + '%',
      volume: parseInt(quote['06. volume']),
      high: parseFloat(quote['03. high']).toFixed(2),
      low: parseFloat(quote['04. low']).toFixed(2),
      time: quote['07. latest trading day'],
    };

    // Save to cache
    await setCache(cacheKey, data);
    return data;
  };

  return await withRetry(fetchQuote);
}

async function getCompanyOverview(symbol) {
  const cacheKey = `overview_${symbol}`;

  // Try to get from cache first
  const cached = await getCache(cacheKey);
  if (cached) {
    return cached.data;
  }

  // If not in cache, fetch from API with retry
  const fetchOverview = async () => {
    const option = {
      uri: `${BASE_URL}?function=OVERVIEW&symbol=${symbol}&apikey=${API_KEY}`,
      json: true,
      timeout: 5000,
    };

    const response = await rp.get(option);

    if (!response || !response.MarketCapitalization) {
      throw new Error(`Failed to get company info for ${symbol}`);
    }

    const data = {
      mktcap:
        (parseFloat(response.MarketCapitalization) / 1000000000).toFixed(2) +
        'B',
      name: response.Name,
      industry: response.Industry,
      sector: response.Sector,
    };

    // Save to cache
    await setCache(cacheKey, data);
    return data;
  };

  return await withRetry(fetchOverview);
}

exports.main = async (event, context) => {
  const symbols = ['MSFT', 'AAPL', 'NVDA', 'GOOG'];
  try {
    const stocks = [];
    // Fetch all stocks with reduced concurrency
    for (const symbol of symbols) {
      try {
        const [quoteData, overviewData] = await Promise.all([
          getStockQuote(symbol),
          getCompanyOverview(symbol),
        ]);

        stocks.push({
          ...quoteData,
          ...overviewData,
        });

        // Smaller delay between batches
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error processing ${symbol} data:`, error);

        // Try to get cached data as fallback
        const cachedQuote = await getCache(`quote_${symbol}`);
        const cachedOverview = await getCache(`overview_${symbol}`);

        if (cachedQuote && cachedOverview) {
          stocks.push({
            ...cachedQuote.data,
            ...cachedOverview.data,
            fromCache: true,
          });
        }
      }
    }

    if (stocks.length === 0) {
      throw new Error('No stock data retrieved');
    }

    // Sort by market cap
    stocks.sort((a, b) => {
      const mktcapA = parseFloat(a.mktcap);
      const mktcapB = parseFloat(b.mktcap);
      return mktcapB - mktcapA;
    });

    const top1 = stocks[0];
    const msft = stocks.find((stock) => stock.symbol === 'MSFT') || null;

    return {
      code: 0,
      message: 'success',
      data: {
        top1,
        msft,
        stocks,
        timestamp: new Date().getTime(),
        dataSource: 'Alpha Vantage',
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
