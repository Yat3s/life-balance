const cloud = require('wx-server-sdk');
const rp = require('request-promise');

const API_KEY = 'WEQGVELPMJ086QXP';
const BASE_URL = 'https://www.alphavantage.co/query';

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

async function getStockQuote(symbol) {
  try {
    const option = {
      uri: `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`,
      json: true,
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
      changePercent: quote['10. change percent'].replace('%', '') + '%',
      volume: parseInt(quote['06. volume']),
      high: parseFloat(quote['03. high']).toFixed(2),
      low: parseFloat(quote['04. low']).toFixed(2),
      time: quote['07. latest trading day'],
    };
  } catch (error) {
    console.error(`Failed to fetch ${symbol} quote data:`, error);
    throw error;
  }
}

async function getCompanyOverview(symbol) {
  try {
    const option = {
      uri: `${BASE_URL}?function=OVERVIEW&symbol=${symbol}&apikey=${API_KEY}`,
      json: true,
    };
    // Fetch company overview
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
  } catch (error) {
    console.error(`Failed to fetch ${symbol} company data:`, error);
    throw error;
  }
}

exports.main = async (event, context) => {
  // List of stock symbols to fetch
  const symbols = ['MSFT', 'AAPL', 'NVDA', 'GOOG'];

  try {
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
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

        // Add delay to avoid API rate limits
        await delay(1000);
      } catch (error) {
        console.error(`Error processing ${symbol} data:`, error);
      }
    }

    if (stocks.length === 0) {
      throw new Error('No stock data retrieved');
    }

    // Sort stocks by market cap
    stocks.sort((a, b) => {
      const mktcapA = parseFloat(a.mktcap);
      const mktcapB = parseFloat(b.mktcap);
      return mktcapB - mktcapA;
    });

    // Get top stock and Microsoft data
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
