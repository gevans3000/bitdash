const config = require('./config');
const cache = require('./cache');
const { dashboardData } = require('./dashboard');
const { logError } = require('./api');

function registerRoutes(app) {
  app.get('/api/dashboard', (req, res) => {
    try {
      res.json({
        ...dashboardData,
        rateLimit: undefined,
      });
    } catch (err) {
      logError('Error serving dashboard data:', err);
      res.status(500).json({
        error: 'Failed to fetch dashboard data',
        details: err.message,
      });
    }
  });

  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      rateLimit: {
        ...dashboardData.rateLimit,
        limit: config.coinGecko.rateLimit,
        window: config.coinGecko.rateLimitWindow / 1000 + 's',
      },
      cache: {
        keys: cache.keys().length,
        stats: cache.getStats(),
      },
    });
  });
}

module.exports = registerRoutes;
