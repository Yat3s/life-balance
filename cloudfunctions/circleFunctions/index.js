const addCircle = require("./actions/addCircle");

exports.main = async (event, context) => {
  const props = event.data;
  switch (event.action) {
    case "addCircle":
      return await addCircle.main(props, context);
  }
};
