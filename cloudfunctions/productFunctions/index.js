const createItem = require('./actions/createItem');

exports.main = async (event, context) => {
  const props = event.data;

  switch (event.action) {
    case 'createItem':
      return await createItem.main(props, context);
  }
};
