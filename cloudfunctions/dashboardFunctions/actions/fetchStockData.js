const cloud = require('wx-server-sdk');
const rp = require('request-promise');
const SYMBOL_MSFT = 'MSFT';

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (data, context) => {
  const symbols = ['MSFT', 'AAPL', 'AMZN', 'GOOG'];

  var option = {
    uri: `http://hq.sinajs.cn/list=gb_msft,gb_aapl,gb_amzn,gb_goog`,
    headers: {
      'Referer': 'https://stock.finance.sina.com.cn/',
    },
    json: false,
  }

  const stockStringList = (await rp.get(option)).split('\n');
  console.log(stockStringList);

  let top1 = {
    mktcap: 0
  }
  let msft = {

  }

  let stocks = [];

  for (var i = 0; i < stockStringList.length; i++) {
    const item = stockStringList[i];
    if (!item) {
      continue;
    }

    const stockInfoArray = item.match(/\"(.*?)\"/)[1].split(',');
    const mktcap = stockInfoArray[12];
    const symbol = symbols[i];

    stocks.push({
      symbol,
      mktcap,
    })

    if (mktcap > top1.mktcap) {
      top1.mktcap = mktcap;
      top1.symbol = symbol;
    }

    if (symbol === 'MSFT') {
      msft.change = stockInfoArray[2];
      msft.price = parseFloat(stockInfoArray[1]).toFixed(2) + "";
      msft.mktcap = mktcap;
      msft.symbol = symbol;
    }
  }
  
  stocks.sort((a, b) => {
    return b.mktcap - a.mktcap
  })

  return {
    top1,
    msft,
    stocks
  }
}