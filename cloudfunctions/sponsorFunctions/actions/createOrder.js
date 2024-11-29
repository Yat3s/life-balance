const cloud = require("wx-server-sdk");
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (props, context) => {
  const openid = cloud.getWXContext().OPENID;
  const { amount } = props;

  if (!amount || amount <= 0) {
    throw new Error("invalid amount");
  }

  const wechatOrderId = generateOrderNo();
  const createOrderResponse = await cloud.cloudPay.unifiedOrder({
    body: `安德科技-Buy developer a coffee`,
    outTradeNo: wechatOrderId,
    spbillCreateIp: "123.12.12.123",
    subMchId: "1638480210",
    totalFee: amount * 100,
    functionName: "paycallback",
    envId: "life-6go5gey72a61a773",
    nonceStr: generateNonceStr(),
    freeType: "CNY",
    tradeType: "JSAPI",
    openid,
  });

  return {
    ...createOrderResponse,
    orderId: wechatOrderId,
    totalFee: amount,
  };
};

function generateOrderNo() {
  const datePrefix = getFormattedDateString();
  const randomSuffix = Math.floor(Math.random() * 1000000).toString();
  return `${datePrefix}${randomSuffix}`;
}

function getFormattedDateString() {
  const date = new Date();
  const datePrefix = `${date.getFullYear()}${String(
    date.getMonth() + 1
  ).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}${String(
    date.getHours()
  ).padStart(2, "0")}${String(date.getMinutes()).padStart(2, "0")}${String(
    date.getSeconds()
  ).padStart(2, "0")}`;

  return `${datePrefix}`;
}

function generateNonceStr() {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const length = 16;
  let result = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }
  return result;
}
