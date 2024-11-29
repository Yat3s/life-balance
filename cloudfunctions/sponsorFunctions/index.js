const createOrder = require("./actions/createOrder");
const createSponsor = require("./actions/createSponsor");
const fetchAllSponsors = require("./actions/fetchAllSponsors");

exports.main = async (event, context) => {
  const props = event.data;

  switch (event.action) {
    case "createOrder":
      return await createOrder.main(props, context);
    case "createSponsor":
      return await createSponsor.main(props, context);
    case "fetchAllSponsors":
      return await fetchAllSponsors.main(props, context);
    default:
      return {
        success: false,
        message: "Invalid action",
      };
  }
};
