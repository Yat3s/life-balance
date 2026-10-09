const cloud = require('wx-server-sdk');
const rp = require('request-promise');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

// This new function is used by the new mini program package only. Keep its
// cache separate so staging does not change the released dashboard function.
const CACHE_KEY = 'stockDataCacheV2';
const LEGACY_CACHE_KEY = 'stockDataCache';
const CACHE_TTL = 10 * 60 * 1000;
const MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000;
const pendingRequests = new Map();

const cacheOperations = {
  async get() {
    try {
      let result = await db.collection('appconfig').where({ key: CACHE_KEY }).get();
      if (!result.data.length) {
        result = await db.collection('appconfig').where({ key: LEGACY_CACHE_KEY }).get();
      }
      const cached = result.data[0];
      if (!cached || !cached.value) return null;
      return {
        ...cached.value,
        timestamp: cached.value.timestamp || new Date(cached.updateTime).getTime(),
      };
    } catch (error) {
      console.error('Error fetching stock cache:', error);
      return null;
    }
  },

  async update(value) {
    try {
      const data = { value, updateTime: new Date() };
      const result = await db.collection('appconfig').where({ key: CACHE_KEY }).update({ data });
      if (result.stats.updated === 0) {
        await db.collection('appconfig').add({ data: { key: CACHE_KEY, ...data } });
      }
    } catch (error) {
      // A cache write failure must not discard a successful quote response.
      console.error('Error updating stock cache:', error);
    }
  },
};

function parseQuotes(body, symbols) {
  const quotes = new Map();
  const pattern = /v_us([A-Z]+)="([^"\r\n]*)";/g;
  let match;
  while ((match = pattern.exec(String(body))) !== null) {
    const symbol = match[1];
    if (!symbols.includes(symbol)) continue;
    const fields = match[2].split('~');
    const price = Number(fields[3]);
    const change = Number(fields[31]);
    const changePercent = Number(fields[32]);
    // Tencent's own US quote page uses field 68, falling back to 45,
    // for company market cap in USD 100 millions: https://gu.qq.com/usMSFT
    const marketCap = Number(fields[68] || fields[45]);
    if (
      (fields[2] || '').split('.')[0] !== symbol || fields[35] !== 'USD' ||
      !Number.isFinite(price) || price <= 0 ||
      !Number.isFinite(marketCap) || marketCap <= 0 ||
      !fields[31] || !fields[32] ||
      !Number.isFinite(change) || !Number.isFinite(changePercent) ||
      !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(fields[30] || '')
    ) {
      throw new Error(`Invalid quote for ${symbol}`);
    }
    quotes.set(symbol, {
      symbol,
      name: fields[46] || symbol,
      price: price.toFixed(2),
      change: change.toFixed(2),
      changePercent: `${changePercent.toFixed(2)}%`,
      formattedChange: `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}`,
      // Keep the existing API's billions suffix; the card displays trillions.
      mktcap: `${(marketCap / 10).toFixed(2)}B`,
      time: fields[30],
    });
  }
  if (!symbols.every((symbol) => quotes.has(symbol))) {
    throw new Error('Incomplete stock quotes');
  }
  return symbols.map((symbol) => quotes.get(symbol));
}

function fetchQuotes(symbols) {
  const key = symbols.join(',');
  if (!pendingRequests.has(key)) {
    const request = rp.get({
      uri: `https://qt.gtimg.cn/q=${symbols.map((symbol) => `us${symbol}`).join(',')}`,
      timeout: 5000,
      // Numeric fields and English company names are ASCII in the GBK response.
      encoding: 'utf8',
    }).then((body) => ({
      stocks: parseQuotes(body, symbols),
      dataSource: 'Tencent Finance',
      timestamp: Date.now(),
    })).finally(() => pendingRequests.delete(key));
    pendingRequests.set(key, request);
  }
  return pendingRequests.get(key);
}

function hasUsableCache(cached, symbols) {
  if (!cached || !Array.isArray(cached.stocks)) return false;
  const age = Date.now() - cached.timestamp;
  if (!Number.isFinite(age) || age < 0 || age > MAX_CACHE_AGE) return false;
  return symbols.every((symbol) => cached.stocks.some((stock) =>
    stock && stock.symbol === symbol && Number.isFinite(Number(stock.price)) &&
    Number(stock.price) > 0 && /^\d+(?:\.\d+)?B$/.test(stock.mktcap) &&
    Number.isFinite(parseFloat(stock.mktcap)) && parseFloat(stock.mktcap) > 0 &&
    /^[+-]?\d+(?:\.\d+)?$/.test(stock.formattedChange)
  ));
}

async function getStockData(symbols, cached) {
  const usableCache = hasUsableCache(cached, symbols);
  const fromCache = (stale) => ({
    stocks: symbols.map((symbol) => cached.stocks.find((stock) => stock.symbol === symbol)),
    dataSource: cached.dataSource || 'Cache',
    timestamp: cached.timestamp,
    fromCache: true,
    stale,
  });
  if (usableCache && Date.now() - cached.timestamp < CACHE_TTL) return fromCache(false);

  try {
    return { ...await fetchQuotes(symbols), fromCache: false, stale: false };
  } catch (error) {
    console.error('Failed to refresh stock quotes:', error.message);
    if (usableCache) return fromCache(true);
    throw error;
  }
}

module.exports = { cacheOperations, getStockData, parseQuotes };
