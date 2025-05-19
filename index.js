/*
CryptoDashboard - Local Crypto Dashboard

How to run:
  1. Install dependencies: npm install
  2. Start server:        node index.js
  3. Open browser:        http://localhost:3000

How to change update interval:
  - Edit the value of UPDATE_INTERVAL_MS at the top of this file (default: 60000 ms = 1 minute)

How to edit color-coding rules:
  - See the getCellColor function in /public/index.html for frontend logic

All metrics for Bitcoin and Ethereum are fetched from CoinGecko (free, no-auth API).
SPY metrics are fetched from Yahoo Finance (free, no-auth API, unofficial endpoint).
Fear & Greed Index is fetched from Alternative.me.
Trending coins from CoinGecko.
API polling is rate-limited to once per minute.
Errors are logged to the console.
*/

const express = require('express');
const axios = require('axios');
const path = require('path');
const { sma, rsi, macd } = require('./utils/indicators');
const { findSwingHighsAndLows, groupPriceLevels } = require('./utils/supportResistance');

const UPDATE_INTERVAL_MS = 60000; // 1 minute
const PORT = 3000;

const app = express();
app.use(express.static(path.join(__dirname, 'public')));

// In-memory cache for polled data
let dashboardData = {
  btc: null,
  eth: null,
  spy: null,
  spx: null,
  trending: [],
  fearGreed: null,
  lastUpdated: null,
  error: null
};

// Utility for logging errors
function logError(msg, err) {
  console.error(`[ERROR] ${msg}`);
  if (err) console.error(err);
}

// Fetch market data and indicators for a coin (BTC/ETH)
async function fetchCoinData(coinId) {
  try {
    // Price, 24h change, volume
    const marketRes = await axios.get(
      `https://api.coingecko.com/api/v3/coins/markets`,
      {
        params: {
          vs_currency: 'usd',
          ids: coinId
        },
        timeout: 10000
      }
    );
    const market = marketRes.data[0];

    // Historical daily candles (for SMA, RSI, MACD)
    const histRes = await axios.get(
      `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart`,
      {
        params: {
          vs_currency: 'usd',
          days: 90,
          interval: 'daily'
        },
        timeout: 10000
      }
    );
    const priceData = histRes.data.prices.map(([timestamp, price]) => ({
      timestamp,
      price,
      date: new Date(timestamp)
    }));

    const closes = priceData.map(p => p.price);

    // Calculate indicators
    const sma50 = sma(closes, 50);
    const rsi14 = rsi(closes, 14);
    const macdObj = macd(closes, 12, 26, 9);

    // Get volume data if available
    const volumes = histRes.data.total_volumes?.map(([timestamp, volume]) => ({
      timestamp,
      volume
    })) || [];

    // Create volume map by timestamp for quick lookup
    const volumeMap = new Map(volumes.map(v => [v.timestamp, v.volume]));

    // Find swing highs and lows with volume data
    const { swingHighs, swingLows } = findSwingHighsAndLows(priceData, 3, 3);
    
    // Add volume data to swing points
    const enhanceWithVolume = (points) => 
      points.map(p => ({
        ...p,
        volume: volumeMap.get(p.timestamp) || 0,
        strength: 1 // Base strength
      }));
    
    // Group nearby levels with enhanced clustering
    const clusterOptions = {
      threshold: 0.01, // 1% price threshold
      volumeWeighted: true,
      timeDecay: true
    };
    
    const supportLevels = groupPriceLevels(enhanceWithVolume(swingLows), clusterOptions);
    const resistanceLevels = groupPriceLevels(enhanceWithVolume(swingHighs), clusterOptions);

    // Get date range from price data
    const timestamps = priceData.map(p => p.timestamp).filter(Boolean);
    const dateRange = timestamps.length > 0 
      ? {
          start: new Date(Math.min(...timestamps)),
          end: new Date(Math.max(...timestamps))
        }
      : null;

    return {
      price: market.current_price,
      change24h: market.price_change_percentage_24h,
      volume24h: market.total_volume,
      sma50: sma50[sma50.length - 1],
      rsi14: rsi14[rsi14.length - 1],
      macd: macdObj.macd[macdObj.macd.length - 1],
      macdSignal: macdObj.signal[macdObj.signal.length - 1],
      macdHist: macdObj.histogram[macdObj.histogram.length - 1],
      supportLevels: supportLevels.slice(0, 5), // Top 5 support levels
      resistanceLevels: resistanceLevels.slice(0, 5), // Top 5 resistance levels
      dateRange: dateRange ? {
        start: dateRange.start.toISOString(),
        end: dateRange.end.toISOString(),
        startYear: dateRange.start.getFullYear(),
        endYear: dateRange.end.getFullYear()
      } : null
    };
  } catch (err) {
    logError(`Failed to fetch data for ${coinId}`, err);
    return null;
  }
}

// Fetch SPY data from Yahoo Finance
async function fetchYahooData(symbol) {
  try {
    // Yahoo Finance unofficial API (returns daily candles)
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=3mo&interval=1d`;
    const res = await axios.get(url, { timeout: 10000 });
    const chart = res.data.chart.result[0];
    const closes = chart.indicators.quote[0].close;
    const timestamps = chart.timestamp;
    const lastIdx = closes.length - 1;
    const price = closes[lastIdx];
    const prevPrice = closes[lastIdx - 1];
    const change24h = ((price - prevPrice) / prevPrice) * 100;
    const volume24h = chart.indicators.quote[0].volume[lastIdx];
    const sma50 = sma(closes, 50);
    const rsi14 = rsi(closes, 14);
    const macdObj = macd(closes, 12, 26, 9);
    return {
      price,
      change24h,
      volume24h,
      sma50: sma50[sma50.length - 1],
      rsi14: rsi14[rsi14.length - 1],
      macd: macdObj.macd[macdObj.macd.length - 1],
      macdSignal: macdObj.signal[macdObj.signal.length - 1],
      macdHist: macdObj.histogram[macdObj.histogram.length - 1]
    };
  } catch (err) {
    logError(`Failed to fetch ${symbol} data`, err);
    return null;
  }
}

async function fetchSPYData() {
  return fetchYahooData('SPY');
}

async function fetchSPXData() {
  return fetchYahooData('^GSPC');
}

// Fetch trending coins
async function fetchTrending() {
  try {
    const res = await axios.get(
      'https://api.coingecko.com/api/v3/search/trending',
      { timeout: 10000 }
    );
    return res.data.coins.slice(0, 7).map(c => c.item.name);
  } catch (err) {
    logError('Failed to fetch trending coins', err);
    return [];
  }
}

// Fetch Fear & Greed Index
async function fetchFearGreed() {
  try {
    const res = await axios.get(
      'https://api.alternative.me/fng/?limit=1',
      { timeout: 10000 }
    );
    const value = parseInt(res.data.data[0].value);
    const label = res.data.data[0].value_classification;
    return { value, label };
  } catch (err) {
    logError('Failed to fetch Fear & Greed Index', err);
    return null;
  }
}

// Poll all APIs and update dashboardData
async function updateDashboard() {
  try {
    const [btc, eth, spy, spx, trending, fearGreed] = await Promise.all([
      fetchCoinData('bitcoin'),
      fetchCoinData('ethereum'),
      fetchSPYData(),
      fetchSPXData(),
      fetchTrending(),
      fetchFearGreed()
    ]);
    dashboardData = {
      btc,
      eth,
      spy,
      spx,
      trending,
      fearGreed,
      lastUpdated: new Date(),
      error: null
    };
  } catch (err) {
    logError('Dashboard update failed', err);
    dashboardData.error = 'Dashboard update failed';
  }
}

// Initial update and interval polling
updateDashboard();
setInterval(updateDashboard, UPDATE_INTERVAL_MS);

// API endpoint for dashboard data
app.get('/api/dashboard', (req, res) => {
  res.json(dashboardData);
});

// Fallback route: serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`CryptoDashboard running at http://localhost:${PORT}`);
});
