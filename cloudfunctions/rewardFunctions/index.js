const createReward = require("./actions/createReward");
const updateReward = require("./actions/updateReward");

exports.main = async (event, context) => {
  const props = event.data;

  switch (event.action) {
    case "createReward":
      return await createReward.main(props, context);
    case "updateReward":
      return await updateReward.main(props, context);
    default:
      return {
        success: false,
        message: "Invalid action",
      };
  }
};
