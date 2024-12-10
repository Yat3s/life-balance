const fetchAllPartnerMerchants = require("./actions/fetchAllPartnerMerchants");
const postComment = require("./actions/postComment");
const deleteComment = require("./actions/deleteComment");
const updateComment = require("./actions/updateComment");
exports.main = async (event, context) => {
  const props = event.data;
  switch (event.action) {
    case "fetchAllPartnerMerchants":
      return await fetchAllPartnerMerchants.main(props, context);
    case "postComment":
      return await postComment.main(props, context);
    case "deleteComment":
      return await deleteComment.main(props, context);
    case "updateComment":
      return await updateComment.main(props, context);
  }
};
