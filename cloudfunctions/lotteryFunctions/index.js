const fetchAllLotteries = require("./actions/fetchAllLotteries");
const createLottery = require("./actions/createLottery");
const createLotteryTicket = require("./actions/createLotteryTicket");

exports.main = async (event, context) => {
  const props = event.data;

  switch (event.action) {
    case "fetchAllLotteries":
      return await fetchAllLotteries.main(props, context);
    case "createLottery":
      return await createLottery.main(props, context);
    case "createLotteryTicket":
      return await createLotteryTicket.main(props, context);
    default:
      return {
        success: false,
        message: "Invalid action",
      };
  }
};
