const updateAppconfig = require("./actions/updateAppconfig");

exports.main = async (event, context) => {
  const data = event.data;
  switch (event.action) {
    case "updateAppconfig":
      return await updateAppconfig.main(data, context);
  }
};
