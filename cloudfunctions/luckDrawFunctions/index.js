const fetchAll = require("./actions/fetchAll");
const createTicket = require("./actions/createTicket");
const fetchLatest = require("./actions/fetchLatest");
const draw = require("./actions/draw");

exports.main = async (event, context) => {
  const props = event.data;

  switch (event.action) {
    case "fetchAll":
      return await fetchAll.main(props, context);
    case "fetchLatest":
      return await fetchLatest.main(props, context);
    case "createTicket":
      return await createTicket.main(props, context);
    case "draw":
      return await draw.main(props, context);
    default:
      return {
        success: false,
        message: "Invalid action",
      };
  }
};
