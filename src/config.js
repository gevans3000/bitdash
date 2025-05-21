const config = {
  updateIntervalMs: process.env.UPDATE_INTERVAL_MS ? parseInt(process.env.UPDATE_INTERVAL_MS) : 600000,
  port: process.env.PORT || 3000,
  coinGecko: {
    apiKey: process.env.COINGECKO_API_KEY || '',
    baseUrl: 'https://api.coingecko.com/api/v3',
    rateLimit: process.env.COINGECKO_API_KEY ? 30 : 8,
    rateLimitWindow: 60 * 1000,
    maxRetries: 2,
    retryDelay: 10000,
  },
  cache: {
    ttl: process.env.CACHE_TTL ? parseInt(process.env.CACHE_TTL) : 900,
    checkperiod: 120,
  },
};

module.exports = config;
