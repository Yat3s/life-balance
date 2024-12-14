const fetchAll = require("./actions/fetchAll");
const createTicket = require("./actions/createTicket");

exports.main = async (event, context) => {
  const props = event.data;

  switch (event.action) {
    case "fetchAll":
      return await fetchAll.main(props, context);
    case "createTicket":
      return await createTicket.main(props, context);
    default:
      return {
        success: false,
        message: "Invalid action",
      };
  }
};
