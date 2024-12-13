const cloud = require("wx-server-sdk");
const rp = require("request-promise");

const API_KEY = "WEQGVELPMJ086QXP";
const BASE_URL = "https://www.alphavantage.co/query";
const CACHE_TIME = 5 * 60 * 1000; // 5 minutes cache

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

function formatPriceChange(changePercent) {
  const percentValue = parseFloat(changePercent.replace("%", ""));
  const sign = percentValue >= 0 ? "+" : "";
  return `${sign}${percentValue.toFixed(2)}`;
}

function formatMarketCap(mktcap) {
  const numericValue = parseFloat(mktcap.replace("B", ""));
  return (numericValue / 1000).toFixed(2);
}

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
      .collection("stockCache")
      .where({
        key,
        timestamp: cloud.database().command.gt(Date.now() - CACHE_TIME),
      })
      .limit(1)
      .get();

    return result.data[0];
  } catch (error) {
    console.error("Cache read error:", error);
    return null;
  }
}

async function setCache(key, data) {
  try {
    const db = cloud.database();
    const existing = await getCache(key);

    if (existing) {
      await db
        .collection("stockCache")
        .doc(existing._id)
        .update({
          data: {
            data,
            timestamp: Date.now(),
          },
        });
    } else {
      await db.collection("stockCache").add({
        data: {
          key,
          data,
          timestamp: Date.now(),
        },
      });
    }
  } catch (error) {
    console.error("Cache write error:", error);
  }
}

async function getStockQuote(symbol) {
  const cacheKey = `quote_${symbol}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached.data;

  const fetchQuote = async () => {
    const option = {
      uri: `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`,
      json: true,
      timeout: 5000,
    };

    const response = await rp.get(option);
    const quote = response["Global Quote"];

    if (!quote || !quote["05. price"]) {
      throw new Error(`Failed to get data for ${symbol}`);
    }

    const data = {
      symbol,
      price: parseFloat(quote["05. price"]).toFixed(2),
      change: parseFloat(quote["09. change"]).toFixed(2),
      changePercent: quote["10. change percent"].trim(),
      formattedChange: formatPriceChange(quote["10. change percent"].trim()),
      volume: parseInt(quote["06. volume"]),
      high: parseFloat(quote["03. high"]).toFixed(2),
      low: parseFloat(quote["04. low"]).toFixed(2),
      time: quote["07. latest trading day"],
    };

    await setCache(cacheKey, data);
    return data;
  };

  return await withRetry(fetchQuote);
}

async function getCompanyOverview(symbol) {
  const cacheKey = `overview_${symbol}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached.data;

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
      mktcap: formatMarketCap(
        (parseFloat(response.MarketCapitalization) / 1000000000).toFixed(2) +
          "B"
      ),
      name: response.Name,
      industry: response.Industry,
      sector: response.Sector,
    };

    await setCache(cacheKey, data);
    return data;
  };

  return await withRetry(fetchOverview);
}

exports.main = async (event, context) => {
  const symbols = ["MSFT", "AAPL", "NVDA", "GOOG"];
  try {
    const stocks = [];

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

        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error processing ${symbol} data:`, error);
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
      throw new Error("No stock data retrieved");
    }

    // Sort by market cap (now in trillions)
    stocks.sort((a, b) => parseFloat(b.mktcap) - parseFloat(a.mktcap));

    const top1 = stocks[0];
    const msft = stocks.find((stock) => stock.symbol === "MSFT") || null;

    return {
      code: 0,
      message: "success",
      data: {
        top1,
        msft: msft
          ? {
              ...msft,
              change: msft.formattedChange, // Now only returns the percentage value
            }
          : null,
        stocks,
        timestamp: new Date().getTime(),
        dataSource: "Alpha Vantage",
      },
    };
  } catch (error) {
    console.error("Failed to fetch stock data:", error);
    return {
      code: -1,
      message: error.message || "Failed to fetch stock data",
      data: null,
    };
  }
};
