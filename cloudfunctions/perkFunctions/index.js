const fetchAllPartnerMerchants = require("./actions/fetchAllPartnerMerchants");
const postComment = require("./actions/postComment");

exports.main = async (event, context) => {
  const props = event.data;
  switch (event.action) {
    case "fetchAllPartnerMerchants":
      return await fetchAllPartnerMerchants.main(props, context);
    case "postComment":
      return await postComment.main(props, context);
  }
};
