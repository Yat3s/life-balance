const cloud = require("wx-server-sdk");
const rp = require("request-promise");

const API_KEY = "WEQGVELPMJ086QXP";
const BASE_URL = "https://www.alphavantage.co/query";

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

function formatChange(changePercent) {
  const percentValue = parseFloat(changePercent.replace("%", ""));
  const sign = percentValue >= 0 ? "+" : "";
  return `${sign}${percentValue.toFixed(2)}`;
}

async function withRetry(fn, retries = 3, delay = 1000) {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return withRetry(fn, retries - 1, delay * 1.5);
  }
}

async function getStockQuote(symbol) {
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

    return {
      symbol,
      price: parseFloat(quote["05. price"]).toFixed(2),
      change: parseFloat(quote["09. change"]).toFixed(2),
      changePercent: quote["10. change percent"].trim(),
      formattedChange: formatChange(quote["10. change percent"].trim()),
      volume: parseInt(quote["06. volume"]),
      high: parseFloat(quote["03. high"]).toFixed(2),
      low: parseFloat(quote["04. low"]).toFixed(2),
      time: quote["07. latest trading day"],
    };
  };

  return await withRetry(fetchQuote);
}

async function getCompanyOverview(symbol) {
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

    return {
      mktcap:
        (parseFloat(response.MarketCapitalization) / 1000000000).toFixed(2) +
        "B",
      name: response.Name,
      industry: response.Industry,
      sector: response.Sector,
    };
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
      }
    }

    if (stocks.length === 0) {
      throw new Error("No stock data retrieved");
    }

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
              change: msft.formattedChange,
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
