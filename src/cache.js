const NodeCache = require('node-cache');
const config = require('./config');

const cache = new NodeCache({
  stdTTL: config.cache.ttl,
  checkperiod: config.cache.checkperiod,
  useClones: false,
});

module.exports = cache;
