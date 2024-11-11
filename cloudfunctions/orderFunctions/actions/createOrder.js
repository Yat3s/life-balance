const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const COLLECTION_NAME_ORDERS = 'orders';
const COLLECTION_NAME_PRODUCTS = 'products';

exports.main = async (props, context) => {
  const openid = cloud.getWXContext().OPENID;
  const { productId } = props;

  const product = (
    await db.collection(COLLECTION_NAME_PRODUCTS).doc(productId).get()
  ).data;

  if (!product) {
    throw new Error('product not found');
  }

  const wechatOrderId = generateOrderNo();
  const productTitle = `安得科技-${product.title}`;
  const createOrderResponse = await cloud.cloudPay.unifiedOrder({
    body: productTitle,
    totalFee: product.price * 100,
    functionName: 'paycallback',
    envId: 'life-6go5gey72a61a773',
    subMchId: '1675638558',
    nonceStr: generateNonceStr(),
    outTradeNo: wechatOrderId,
    freeType: 'CNY',
    spbillCreateIp: '123.12.12.123',
    tradeType: 'JSAPI',
    openid,
  });

  const res = await db.collection(COLLECTION_NAME_ORDERS).add({
    data: {
      totalFee: product.price,
      product: product,
      productId,
      paid: 0,
      wechatOrderId,
      userId: openid,
      createdAt: Date.now(),
    },
  });

  return {
    ...createOrderResponse,
    orderId: res._id,
    totalFee: product.price,
  };
};

function getFormattedDateString() {
  // Get the current date in the format YYYYMMDDHHMMSS
  const date = new Date();
  const datePrefix = `${date.getFullYear()}${String(
    date.getMonth() + 1
  ).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}${String(
    date.getHours()
  ).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}${String(
    date.getSeconds()
  ).padStart(2, '0')}`;

  return `${datePrefix}`;
}

function generateOrderNo() {
  const datePrefix = getFormattedDateString();
  const randomSuffix = Math.floor(Math.random() * 1000000).toString();

  return `${datePrefix}${randomSuffix}`;
}

function generateNonceStr() {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const length = 16;
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }
  return result;
}