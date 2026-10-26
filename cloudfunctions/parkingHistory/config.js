const fs = require('fs');
const path = require('path');
const { parseConfig } = require('./settings');

module.exports = parseConfig(fs.readFileSync(path.join(__dirname, 'parking-history.ini'), 'utf8'));
