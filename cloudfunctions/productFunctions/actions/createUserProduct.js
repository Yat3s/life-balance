const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;
const COLLECTION_NAME_FLEA_MARKET_PRODUCTS = "flea-market-products";
const COLLECTION_NAME_USERS = "users";

exports.main = async (props, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { createUserProductData } = props;

  try {
    const userInfo = (
      await db
        .collection(COLLECTION_NAME_USERS)
        .where({
          _openid: openid,
        })
        .get()
    ).data[0];

    const dataToInsert = {
      ...createUserProductData,
      terminated: false,
      userId: openid,
      user: {
        _id: userInfo._id,
        _openid: userInfo._openid,
        avatarUrl: userInfo.avatarUrl,
        nickName: userInfo.nickName,
        ...(userInfo.company ? { company: userInfo.company } : {}),
      },
      createdAt: new Date().getTime(),
      updatedAt: new Date().getTime(),
    };

    const result = await db
      .collection(COLLECTION_NAME_FLEA_MARKET_PRODUCTS)
      .add({
        data: dataToInsert,
      });

    return {
      success: true,
      data: result._id,
      message: "Item created successfully",
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: "Failed to create item",
    };
  }
};
