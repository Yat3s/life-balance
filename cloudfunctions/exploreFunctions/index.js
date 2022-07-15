const joinCircle = require('./actions/joinCircle')
const msftBoost = require('./actions/msftBoost')

exports.main = async (event, context) => {
  const data = event.data;
  switch (event.action) {
    case 'joinCircle':
      return await joinCircle.main(data, context);
    case 'msftBoost':
      return await msftBoost.main(data, context);
  }
}