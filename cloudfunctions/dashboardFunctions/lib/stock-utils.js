const cloud = require('wx-server-sdk');
const rp = require('request-promise');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

const API_CONFIG = {
  key: 'WEQGVELPMJ086QXP',
  baseUrl: 'https://www.alphavantage.co/query',
  rateLimit: 500, // API rate limit in ms
};

const CACHE_CONFIG = {
  collection: 'appconfig',
  key: 'stockDataCache',
};

/**
 * Format percentage change with sign
 */
function formatChange(changePercent) {
  const percentValue = parseFloat(changePercent.replace('%', ''));
  const sign = percentValue >= 0 ? '+' : '';
  return `${sign}${percentValue.toFixed(2)}`;
}

/**
 * Check if current time is within NASDAQ trading hours
 */
function isNasdaqTradingHours() {
  const date = new Date();
  const easternTime = new Date(
    date.toLocaleString('en-US', { timeZone: 'America/New_York' })
  );
  const hours = easternTime.getHours();
  const minutes = easternTime.getMinutes();
  const day = easternTime.getDay();

  if (day === 0 || day === 6) return false;

  const timeInMinutes = hours * 60 + minutes;
  const marketOpen = 9 * 60 + 30; // 9:30 AM
  const marketClose = 16 * 60; // 4:00 PM

  return timeInMinutes >= marketOpen && timeInMinutes < marketClose;
}

/**
 * Retry mechanism for API calls
 */
async function withRetry(fn, retries = 3, delay = 1000) {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return withRetry(fn, retries - 1, delay * 1.5);
  }
}

/**
 * Cache operations
 */
const cacheOperations = {
  async get() {
    try {
      const result = await db
        .collection(CACHE_CONFIG.collection)
        .where({ key: CACHE_CONFIG.key })
        .get();

      const cachedData = result.data[0];
      if (!cachedData) return null;

      const updateTime = new Date(cachedData.updateTime);
      const now = new Date();
      const isSameDay = updateTime.toDateString() === now.toDateString();

      return isSameDay ? cachedData.value : null;
    } catch (error) {
      console.error('Error fetching cache:', error);
      return null;
    }
  },

  async update(data) {
    try {
      const result = await db
        .collection(CACHE_CONFIG.collection)
        .where({ key: CACHE_CONFIG.key })
        .update({
          data: {
            value: data,
            updateTime: new Date(),
          },
        });

      if (result.stats.updated === 0) {
        await db.collection(CACHE_CONFIG.collection).add({
          data: {
            key: CACHE_CONFIG.key,
            value: data,
            updateTime: new Date(),
          },
        });
      }
    } catch (error) {
      console.error('Error updating cache:', error);
    }
  },
};

/**
 * Stock API operations with rate limiting
 */
const stockAPI = {
  async fetchBatch(symbols) {
    const results = [];
    for (const symbol of symbols) {
      const [quote, overview] = await Promise.all([
        this.fetchQuote(symbol),
        this.fetchCompanyOverview(symbol),
      ]);
      results.push({ ...quote, ...overview });
      if (symbols.indexOf(symbol) < symbols.length - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, API_CONFIG.rateLimit)
        );
      }
    }
    return results;
  },

  async fetchQuote(symbol) {
    const fetchQuote = async () => {
      const option = {
        uri: `${API_CONFIG.baseUrl}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_CONFIG.key}`,
        json: true,
        timeout: 5000,
      };

      const response = await rp.get(option);
      const quote = response['Global Quote'];

      if (!quote || !quote['05. price']) {
        throw new Error(`Failed to get data for ${symbol}`);
      }

      return {
        symbol,
        price: parseFloat(quote['05. price']).toFixed(2),
        change: parseFloat(quote['09. change']).toFixed(2),
        changePercent: quote['10. change percent'].trim(),
        formattedChange: formatChange(quote['10. change percent'].trim()),
        volume: parseInt(quote['06. volume']),
        high: parseFloat(quote['03. high']).toFixed(2),
        low: parseFloat(quote['04. low']).toFixed(2),
        time: quote['07. latest trading day'],
      };
    };

    return await withRetry(fetchQuote);
  },

  async fetchCompanyOverview(symbol) {
    const fetchOverview = async () => {
      const option = {
        uri: `${API_CONFIG.baseUrl}?function=OVERVIEW&symbol=${symbol}&apikey=${API_CONFIG.key}`,
        json: true,
        timeout: 5000,
      };

      const response = await rp.get(option);

      if (!response || !response.MarketCapitalization) {
        throw new Error(`Failed to get company info for ${symbol}`);
      }

      return {
        mktcap:
          (parseFloat(response.MarketCapitalization) / 1000000000).toFixed(2) +
          'B',
        name: response.Name,
        industry: response.Industry,
        sector: response.Sector,
      };
    };

    return await withRetry(fetchOverview);
  },
};

module.exports = { stockAPI, cacheOperations, isNasdaqTradingHours };
