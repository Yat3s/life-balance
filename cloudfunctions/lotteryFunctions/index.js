const fetchAllLotteries = require("./actions/fetchAllLotteries");
const createLotteryTicket = require("./actions/createLotteryTicket");
const fetchLatestLottery = require("./actions/fetchLatestLottery");
const drawLottery = require("./actions/drawLottery");

exports.main = async (event, context) => {
  const props = event.data;

  switch (event.action) {
    case "fetchAllLotteries":
      return await fetchAllLotteries.main(props, context);
    case "fetchLatestLottery":
      return await fetchLatestLottery.main(props, context);
    case "createLotteryTicket":
      return await createLotteryTicket.main(props, context);
    case "drawLottery":
      return await drawLottery.main(props, context);
    default:
      return {
        success: false,
        message: "Invalid action",
      };
  }
};
