/*
CryptoDashboard - Local Crypto Dashboard

How to run:
  1. Install dependencies: npm install
  2. Start server:        node index.js
  3. Open browser:        http://localhost:3000
*/

const express = require('express');
const path = require('path');
const rateLimit = require('express-rate-limit');
const config = require('./src/config');
require('./src/cache');
const registerRoutes = require('./src/routes');
require('./src/dashboard');

const app = express();

const apiLimiter = rateLimit({
  windowMs: config.coinGecko.rateLimitWindow,
  max: config.coinGecko.rateLimit,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', apiLimiter);
app.use(express.static(path.join(__dirname, 'public')));

registerRoutes(app);

const server = app.listen(config.port, () => {
  console.log(`Server running at http://localhost:${config.port}`);
  console.log(`Update interval: ${config.updateIntervalMs}ms`);
  console.log(`CoinGecko rate limit: ${config.coinGecko.rateLimit} requests per minute`);
  console.log(`Cache TTL: ${config.cache.ttl} seconds`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

const { logError } = require('./src/api');
process.on('uncaughtException', (err) => {
  logError('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  logError('Unhandled Rejection at:', promise, 'reason:', reason);
});
