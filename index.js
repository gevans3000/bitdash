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
const rateLimit = require('express-rate-limit');
const NodeCache = require('node-cache');
const { sma, rsi, macd } = require('./utils/indicators');
const { findSwingHighsAndLows, groupPriceLevels } = require('./utils/supportResistance');
const { calculateBollingerBands } = require('./utils/bollingerBands');

// Configuration
const config = {
  // Increased update interval to 10 minutes to reduce API calls
  updateIntervalMs: process.env.UPDATE_INTERVAL_MS ? parseInt(process.env.UPDATE_INTERVAL_MS) : 600000, // 10 minutes default
  port: process.env.PORT || 3000,
  coinGecko: {
    apiKey: process.env.COINGECKO_API_KEY || '',
    baseUrl: 'https://api.coingecko.com/api/v3',
    // Be more conservative with rate limits
    rateLimit: process.env.COINGECKO_API_KEY ? 30 : 8, // Reduced from 50/10 to 30/8 calls per minute
    rateLimitWindow: 60 * 1000, // 1 minute
    // Add retry configuration with backoff
    maxRetries: 2, // Reduced from 3
    retryDelay: 10000, // Increased from 5s to 10s
  },
  cache: {
    // Increased cache TTL to 15 minutes (900 seconds)
    ttl: process.env.CACHE_TTL ? parseInt(process.env.CACHE_TTL) : 900,
    // Check for expired items every 120 seconds
    checkperiod: 120,
  },
};

// Initialize cache
const cache = new NodeCache({
  stdTTL: config.cache.ttl,
  checkperiod: config.cache.checkperiod,
  useClones: false,
});

// Initialize Express
const app = express();

// Rate limiting middleware
const apiLimiter = rateLimit({
  windowMs: config.coinGecko.rateLimitWindow,
  max: config.coinGecko.rateLimit,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Set up Axios instance for CoinGecko API with default headers
const coinGeckoApi = axios.create({
  baseURL: config.coinGecko.baseUrl,
  timeout: 10000, // 10 second timeout
  headers: {
    'Accept': 'application/json',
    'Accept-Encoding': 'gzip,deflate,compress',
  },
});

// Add API key to requests if available
if (config.coinGecko.apiKey) {
  coinGeckoApi.interceptors.request.use(apiConfig => {
    apiConfig.params = apiConfig.params || {};
    apiConfig.params.x_cg_pro_api_key = config.coinGecko.apiKey;
    return apiConfig;
  });
}

// Add response caching
coinGeckoApi.interceptors.response.use(
  response => {
    // Cache successful responses
    if (response.config.method === 'get') {
      const url = response.config.url;
      cache.set(url, response.data);
    }
    return response;
  },
  async error => {
    // Try to serve from cache on error
    if (error.config && error.config.method === 'get') {
      const cachedData = cache.get(error.config.url);
      if (cachedData) {
        console.log('Serving from cache after API error');
        return { ...error.response, data: cachedData, fromCache: true };
      }
    }
    return Promise.reject(error);
  }
);

// In-memory cache for dashboard data
let dashboardData = {
  btc: null,
  eth: null,
  spy: null,
  spx: null,
  trending: [],
  fearGreed: null,
  lastUpdated: null,
  error: null,
  rateLimit: {
    remaining: config.coinGecko.rateLimit,
    reset: 0,
    used: 0,
    remainingTime: 0
  }
};

// Utility for logging errors
function logError(message, error) {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] [ERROR] ${message}`);
  if (error) {
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      url: error.config?.url,
    });
  }
}

// Track rate limit usage and update from API response headers
function updateRateLimitInfo(headers) {
  if (!headers) return;
  
  try {
    const remaining = parseInt(headers['x-ratelimit-remaining']);
    const limit = parseInt(headers['x-ratelimit']);
    const resetTime = parseInt(headers['x-ratelimit-reset']);
    
    if (!isNaN(remaining) && !isNaN(limit) && !isNaN(resetTime)) {
      const now = Math.floor(Date.now() / 1000);
      const remainingTime = Math.max(0, resetTime - now);
      
      dashboardData.rateLimit = {
        remaining,
        limit,
        resetTime,
        remainingTime,
        lastUpdated: new Date().toISOString()
      };
      
      if (remaining < 10) {
        console.warn(`Rate limit warning: ${remaining}/${limit} requests remaining. Resets in ${remainingTime}s`);
      }
    }
  } catch (err) {
    console.error('Error updating rate limit info:', err);
  }
}

// Cache key generators
const getMarketCacheKey = (coinId) => `market_${coinId}`;
const getHistoryCacheKey = (coinId) => `history_${coinId}`;

// Helper function to delay execution
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fetch market data with retry logic and better caching
async function fetchWithRetry(url, options = {}, cacheKey = null, retries = config.coinGecko.maxRetries, delayMs = config.coinGecko.retryDelay) {
  // Try to get from cache first if cacheKey is provided
  if (cacheKey) {
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log(`Using cached data for ${cacheKey}`);
      return cached;
    }
  }

  try {
    const response = await axios({
      url,
      ...options,
      headers: {
        ...(config.coinGecko.apiKey ? { 'x-cg-pro-api-key': config.coinGecko.apiKey } : {}),
        ...options.headers,
      },
      timeout: 15000, // Increased timeout
    });
    
    // Update rate limit info from response headers
    updateRateLimitInfo(response.headers);
    
    // Cache the successful response if cacheKey is provided
    if (cacheKey && response.data) {
      cache.set(cacheKey, response.data);
    }
    
    return response.data;
    
  } catch (error) {
    console.error(`API Error for ${url}:`, error.message);
    
    // If we have cached data, return it even if stale
    if (cacheKey) {
      const cached = cache.get(cacheKey);
      if (cached) {
        console.warn(`Using stale cached data for ${cacheKey} due to error`);
        return cached;
      }
    }
    
    // If rate limited and have retries left, wait and retry
    if (error.response?.status === 429 && retries > 0) {
      const retryAfter = error.response?.headers?.['retry-after'] || delayMs / 1000;
      console.warn(`Rate limited. Retrying in ${retryAfter} seconds... (${retries} retries left)`);
      await delay(retryAfter * 1000);
      return fetchWithRetry(url, options, cacheKey, retries - 1, delayMs * 2);
    }
    
    throw error; // Re-throw if no retries left or not a rate limit error
  }
}

// Fetch market data and indicators for a coin (BTC/ETH)
async function fetchCoinData(coinId) {
  const cacheKey = getMarketCacheKey(coinId);
  const historyCacheKey = getHistoryCacheKey(coinId);
  const now = Date.now();
  
  try {
    // Check cache first (5-minute cache for market data, 1-hour for historical)
    const cachedMarket = cache.get(cacheKey);
    const cachedHistory = cache.get(historyCacheKey);
    
    // If we have recent cached data, use it (5 minutes for market data, 1 hour for historical)
    if (cachedMarket && (now - (cachedMarket.timestamp || 0) < 5 * 60 * 1000) &&
        cachedHistory && (now - (cachedHistory.timestamp || 0) < 60 * 60 * 1000)) {
      console.log(`Using cached data for ${coinId}`);
      return {
        ...cachedMarket.data,
        indicators: cachedHistory.data.indicators,
        fromCache: true
      };
    }
    
    // Fetch fresh market data
    console.log(`Fetching fresh data for ${coinId}...`);
    
    // Get current market data
    const marketRes = await fetchWithRetry(
      `${config.coinGecko.baseUrl}/coins/markets`,
      {
        params: {
          vs_currency: 'usd',
          ids: coinId,
          price_change_percentage: '1h,24h,7d,30d,1y',
          precision: '2' // Reduce response size
        },
        timeout: 15000
      },
      `${cacheKey}_market`
    );
    
    if (!marketRes?.[0]) {
      throw new Error(`No market data found for ${coinId}`);
    }
    
    const market = marketRes[0];
    const now = Date.now();
    
    // Fetch price chart data with retry logic and caching
    const chartData = await fetchWithRetry(
      `${config.coinGecko.baseUrl}/coins/${coinId}/market_chart`,
      {
        params: {
          vs_currency: 'usd',
          days: '1',
          interval: 'hourly',
          precision: '2' // Reduce response size
        }
      },
      `${cacheKey}_chart`
    );
    
    const prices = chartData?.prices || [];
    const volumes = chartData?.total_volumes || [];
    
    if (!prices.length) {
      throw new Error('No price data returned from API');
    }
    
    // Process the price and volume data
    const priceData = prices.map(([timestamp, price]) => ({
      timestamp,
      price,
      date: new Date(timestamp)
    }));
    
    const volumeData = volumes.map(([ts, vol]) => ({
      timestamp: ts,
      volume: vol
    }));
    
    // Calculate indicators
    const closes = priceData.map(p => p.price);
    const sma50 = sma(closes, 50);
    const rsi14 = rsi(closes, 14);
    const macdObj = macd(closes, 12, 26, 9);
    
    // Calculate Bollinger Bands
    const bbPeriod = 20;
    const bbStdDev = 2;
    const bollingerBands = calculateBollingerBands(closes, bbPeriod, bbStdDev);
    
    // Calculate support and resistance levels
    const priceDataForSwing = closes.map((price, i) => ({
      price,
      timestamp: priceData[i].timestamp
    }));
    
    const volumeMap = new Map(
      volumes.map((vol, i) => [priceData[i].timestamp, vol])
    );
    
    const { swingHighs, swingLows } = findSwingHighsAndLows(priceDataForSwing, 3, 3);
    
    const enhanceWithVolume = (points) => 
      points.map(p => ({
        ...p,
        volume: volumeMap.get(p.timestamp)?.volume || 0,
        strength: 1
      }));
    
    const clusterOptions = {
      threshold: 0.01,
      volumeWeighted: true,
      timeDecay: true
    };
    
    const supportLevels = groupPriceLevels(enhanceWithVolume(swingLows), clusterOptions);
    const resistanceLevels = groupPriceLevels(enhanceWithVolume(swingHighs), clusterOptions);
    
    // Prepare indicators object
    const lastIndex = closes.length - 1;
    const bbLastIndex = bollingerBands.upper.length - 1;
    
    const indicators = {
      sma50: sma50[lastIndex],
      rsi14: rsi14[lastIndex],
      macd: {
        macd: macdObj.MACD[lastIndex],
        signal: macdObj.signal[lastIndex],
        histogram: macdObj.histogram[lastIndex]
      },
      bollingerBands: {
        upper: bollingerBands.upper[bbLastIndex],
        middle: bollingerBands.middle[bbLastIndex],
        lower: bollingerBands.lower[bbLastIndex]
      },
      supportLevels,
      resistanceLevels
    };
    
    // Cache the results
    const result = {
      price: market.current_price,
      change24h: market.price_change_percentage_24h,
      volume24h: market.total_volume,
      marketCap: market.market_cap,
      high24h: market.high_24h,
      low24h: market.low_24h,
      lastUpdated: market.last_updated,
      indicators,
      fromCache: false
    };
    
    // Update caches
    cache.set(cacheKey, { data: result, timestamp: now });
    cache.set(historyCacheKey, {
      data: { priceData, volumes, indicators },
      timestamp: now
    });
    
    return result;
    
  } catch (error) {
    console.error(`Error in fetchCoinData for ${coinId}:`, error);
    
    // If we have cached data, return it even if stale
    const cachedMarket = cache.get(cacheKey);
    const cachedHistory = cache.get(historyCacheKey);
    
    if (cachedMarket && cachedHistory) {
      console.warn(`Using cached data for ${coinId} due to error`);
      return {
        ...cachedMarket.data,
        indicators: cachedHistory.data.indicators,
        fromCache: true,
        error: `Using cached data due to error: ${error.message}`
      };
    }
    
    throw error; // Re-throw if no cached data available
  }
}

// Cache key generator for Yahoo Finance data
const getYahooCacheKey = (symbol) => `yahoo_${symbol}`;

// Fetch data from Yahoo Finance
async function fetchYahooData(symbol) {
  const cacheKey = getYahooCacheKey(symbol);
  const now = Date.now();
  
  try {
    // Check cache first (15-minute cache for Yahoo data)
    const cached = cache.get(cacheKey);
    if (cached && (now - (cached.timestamp || 0) < 15 * 60 * 1000)) {
      console.log(`Using cached Yahoo data for ${symbol}`);
      return { ...cached.data, fromCache: true };
    }
    
    // Check rate limits
    if (dashboardData.rateLimit.remaining <= 2) {
      const waitTime = dashboardData.rateLimit.remainingTime * 1000 + 1000;
      console.warn(`Approaching rate limit. Waiting ${Math.ceil(waitTime/1000)}s...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    const yahooSymbol = symbol === 'SPY' ? '^GSPC' : symbol;
    console.log(`Fetching fresh data for ${symbol} from Yahoo Finance...`);
    
    const res = await axios.get(
      `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`,
      {
        params: {
          interval: '1d',
          range: '1y',
          includePrePost: false,
          events: 'div|split|earn',
          corsDomain: 'finance.yahoo.com'
        },
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate, br'
        }
      }
    );

    const { chart } = res.data;
    if (!chart?.result?.[0]) {
      throw new Error('Invalid response from Yahoo Finance');
    }

    const { meta, indicators } = chart.result[0];
    
    // Basic validation
    if (!meta || typeof meta.regularMarketPrice !== 'number') {
      throw new Error('Invalid market data from Yahoo Finance');
    }
    
    // Prepare the result
    const result = {
      symbol,
      price: meta.regularMarketPrice,
      change: meta.regularMarketChange,
      changePercent: meta.regularMarketChangePercent,
      volume: meta.regularMarketVolume,
      previousClose: meta.previousClose,
      open: meta.open,
      high: meta.dayHigh,
      low: meta.dayLow,
      yearHigh: meta.fiftyTwoWeekHigh,
      yearLow: meta.fiftyTwoWeekLow,
      timestamp: meta.regularMarketTime || now,
      sma200: meta.fiftyDayAverage,
      sma50: meta.twoHundredDayAverage,
      lastUpdated: new Date().toISOString(),
      fromCache: false
    };
    
    // Cache the result
    cache.set(cacheKey, { data: result, timestamp: now });
    
    return result;
    
  } catch (err) {
    logError(`Failed to fetch ${symbol} data from Yahoo Finance`, err);
    
    // Return cached data if available
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log(`Using cached Yahoo data after error for ${symbol}`);
      return { 
        ...cached.data, 
        fromCache: true,
        error: {
          message: 'Using cached data due to API error',
          originalError: err.message
        }
      };
    }
    
    // If no cache is available, return a minimal error response
    return {
      symbol,
      error: `Failed to fetch data: ${err.message}`,
      lastUpdated: new Date().toISOString()
    };
  }
}

// Wrapper functions for SPY and SPX
async function fetchSPYData() {
  try {
    return await fetchYahooData('SPY');
  } catch (err) {
    logError('Error in fetchSPYData:', err);
    return { symbol: 'SPY', error: err.message };
  }
}

async function fetchSPXData() {
  try {
    return await fetchYahooData('^GSPC');
  } catch (err) {
    logError('Error in fetchSPXData:', err);
    return { symbol: '^GSPC', error: err.message };
  }
}

// Cache keys
const TRENDING_CACHE_KEY = 'trending_coins';
const FEAR_GREED_CACHE_KEY = 'fear_greed_index';

// Fetch trending coins with caching and error handling
async function fetchTrending() {
  const cacheKey = TRENDING_CACHE_KEY;
  const now = Date.now();
  
  try {
    // Check cache first (5 minute cache)
    const cached = cache.get(cacheKey);
    if (cached && (now - (cached.timestamp || 0) < 5 * 60 * 1000)) {
      console.log('Using cached trending coins data');
      return Array.isArray(cached.data) ? cached.data : [];
    }
    
    // Check rate limits
    if (dashboardData.rateLimit.remaining <= 2) {
      const waitTime = dashboardData.rateLimit.remainingTime * 1000 + 1000;
      console.warn(`Approaching rate limit. Waiting ${Math.ceil(waitTime/1000)}s...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    console.log('Fetching fresh trending coins data...');
    const res = await coinGeckoApi.get('/search/trending');
    
    // Update rate limit info
    updateRateLimitInfo(res.headers);
    
    if (!res.data?.coins) {
      throw new Error('Invalid response from CoinGecko API');
    }
    
    const trendingCoins = res.data.coins.map(coin => ({
      id: coin.item.id,
      name: coin.item.name,
      symbol: coin.item.symbol.toUpperCase(),
      price_btc: coin.item.price_btc,
      market_cap_rank: coin.item.market_cap_rank,
      thumb: coin.item.thumb,
      large: coin.item.large,
      price_change_percentage_24h: coin.item.data?.price_change_percentage_24h?.usd
    }));
    
    // Ensure we have a valid array before caching
    const result = Array.isArray(trendingCoins) ? trendingCoins : [];
    
    // Cache the result
    cache.set(cacheKey, { data: result, timestamp: now });
    
    return result;
    
  } catch (error) {
    console.error('Error fetching trending coins:', error);
    
    // Return cached data if available, even if stale
    const cached = cache.get(cacheKey);
    if (cached?.data) {
      console.warn('Using stale cached trending data due to error');
      return { 
        coins: Array.isArray(cached.data) ? cached.data : [], 
        fromCache: true, 
        error: `Using cached data due to API error: ${error.message}` 
      };
    }
    
    // Return empty array if no cached data available
    return { coins: [], fromCache: false, error: `Failed to fetch trending coins: ${error.message}` };
  }
}

// Fetch Fear & Greed Index with caching and error handling
async function fetchFearGreed() {
  const now = Date.now();
  const CACHE_TTL = 60 * 60 * 1000; // 1 hour
  
  try {
    // Check cache first
    const cached = cache.get(FEAR_GREED_CACHE_KEY);
    if (cached && (now - (cached.timestamp || 0) < CACHE_TTL)) {
      console.log('Using cached Fear & Greed Index data');
      return { ...cached.data, fromCache: true };
    }
    
    console.log('Fetching fresh Fear & Greed Index data...');
    const res = await axios.get('https://api.alternative.me/fng/', {
      params: { 
        limit: 1,
        date_format: 'world',
        format: 'json',
        additional: 'true'
      },
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json'
      }
    });
    
    if (!res.data?.data?.[0]) {
      throw new Error('Invalid response from Fear & Greed API');
    }
    
    const fngData = res.data.data[0];
    const value = parseInt(fngData.value);
    
    if (isNaN(value) || value < 0 || value > 100) {
      throw new Error('Invalid Fear & Greed Index value');
    }
    
    // Determine sentiment classification if not provided
    let valueClassification = fngData.value_classification;
    if (!valueClassification) {
      if (value >= 75) valueClassification = 'Extreme Greed';
      else if (value >= 60) valueClassification = 'Greed';
      else if (value >= 45) valueClassification = 'Neutral';
      else if (value >= 25) valueClassification = 'Fear';
      else valueClassification = 'Extreme Fear';
    }
    
    const result = {
      value,
      valueClassification,
      timestamp: parseInt(fngData.timestamp) * 1000 || now,
      lastUpdated: now,
      fromCache: false
    };
    
    // Cache the result
    cache.set(FEAR_GREED_CACHE_KEY, { data: result, timestamp: now });
    
    return result;
    
  } catch (err) {
    logError('Failed to fetch Fear & Greed Index', err);
    
    // Return cached data if available
    const cached = cache.get(FEAR_GREED_CACHE_KEY);
    if (cached) {
      console.log('Using cached Fear & Greed Index data after error');
      return { 
        ...cached.data, 
        fromCache: true,
        error: {
          message: 'Using cached data due to API error',
          originalError: err.message
        }
      };
    }
    
    // If no cache is available, return a minimal error response
    return {
      value: 50, // Neutral as fallback
      valueClassification: 'Neutral',
      timestamp: now,
      error: `Failed to fetch Fear & Greed Index: ${err.message}`,
      lastUpdated: now,
      fromCache: false
    };
  }
}

// Poll all APIs and update dashboardData
async function updateDashboard() {
  const updateStartTime = Date.now();
  let updateError = null;
  
  try {
    console.log('Starting dashboard data update...');
    
    // Check rate limits before making new requests
    if (dashboardData.rateLimit.remaining <= 0) {
      const waitTime = dashboardData.rateLimit.remainingTime * 1000 + 1000; // Add 1 second buffer
      console.warn(`Rate limit reached. Waiting ${Math.ceil(waitTime / 1000)} seconds...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    // Fetch data in parallel with individual error handling
    const [btcData, ethData, spyData, spxData, trendingData, fearGreedData] = await Promise.all([
      fetchCoinData('bitcoin').catch(err => {
        logError('Error fetching Bitcoin data:', err);
        return dashboardData.btc ? 
          { ...dashboardData.btc, error: `Using cached data: ${err.message}`, fromCache: true } : 
          { error: `Failed to fetch Bitcoin data: ${err.message}` };
      }),
      
      fetchCoinData('ethereum').catch(err => {
        logError('Error fetching Ethereum data:', err);
        return dashboardData.eth ? 
          { ...dashboardData.eth, error: `Using cached data: ${err.message}`, fromCache: true } : 
          { error: `Failed to fetch Ethereum data: ${err.message}` };
      }),
      
      fetchSPYData().catch(err => {
        logError('Error fetching SPY data:', err);
        return dashboardData.spy ? 
          { ...dashboardData.spy, error: `Using cached data: ${err.message}`, fromCache: true } : 
          { symbol: 'SPY', error: `Failed to fetch SPY data: ${err.message}` };
      }),
      
      fetchSPXData().catch(err => {
        logError('Error fetching SPX data:', err);
        return dashboardData.spx ? 
          { ...dashboardData.spx, error: `Using cached data: ${err.message}`, fromCache: true } : 
          { symbol: '^GSPC', error: `Failed to fetch SPX data: ${err.message}` };
      }),
      
      fetchTrending().catch(err => {
        logError('Error fetching trending coins:', err);
        return dashboardData.trending?.coins?.length ? 
          { ...dashboardData.trending, error: `Using cached data: ${err.message}`, fromCache: true } : 
          { coins: [], error: `Failed to fetch trending coins: ${err.message}` };
      }),
      
      fetchFearGreed().catch(err => {
        logError('Error fetching Fear & Greed Index:', err);
        return dashboardData.fearGreed?.value !== undefined ?
          { ...dashboardData.fearGreed, error: `Using cached data: ${err.message}`, fromCache: true } :
          { 
            value: 50, 
            valueClassification: 'Neutral', 
            error: `Failed to fetch Fear & Greed Index: ${err.message}` 
          };
      })
    ]);

    // Calculate update duration
    const updateTime = Date.now() - updateStartTime;
    
    // Prepare the updated dashboard data
    const updatedData = {
      btc: btcData,
      eth: ethData,
      spy: spyData,
      spx: spxData,
      trending: trendingData,
      fearGreed: fearGreedData,
      lastUpdated: new Date(),
      updateTime,
      error: null
    };
    
    // Update the dashboard data
    dashboardData = {
      ...dashboardData,
      ...updatedData
    };
    
    // Log successful update
    const successMessage = `Dashboard updated in ${updateTime}ms at ${dashboardData.lastUpdated}`;
    console.log(successMessage);
    
    // Log any errors from individual fetches
    [
      { name: 'Bitcoin', data: btcData },
      { name: 'Ethereum', data: ethData },
      { name: 'SPY', data: spyData },
      { name: 'SPX', data: spxData },
      { name: 'Trending', data: trendingData },
      { name: 'Fear & Greed', data: fearGreedData }
    ].forEach(({ name, data }) => {
      if (data?.error) {
        console.warn(`${name} data warning: ${data.error}`);
      }
    });
    
  } catch (err) {
    updateError = err;
    logError('Critical error updating dashboard data:', err);
    
    dashboardData = {
      ...dashboardData,
      lastUpdated: new Date(),
      updateTime: Date.now() - updateStartTime,
      error: {
        message: 'Failed to update dashboard data',
        details: err.message,
        timestamp: new Date(),
        code: err.code,
        status: err.response?.status
      }
    };
  } finally {
    // Schedule the next update with dynamic interval based on rate limits and errors
    let nextUpdateMs = config.updateIntervalMs;
    
    if (updateError) {
      // If there was an error, try again sooner (but not too fast)
      nextUpdateMs = Math.min(30000, Math.max(5000, config.updateIntervalMs / 2));
      console.warn(`Error during update, retrying in ${nextUpdateMs/1000} seconds...`);
    } else if (dashboardData.rateLimit.remaining < 5) {
      // If we're running low on rate limit, wait longer
      nextUpdateMs = Math.min(
        config.updateIntervalMs * 2, 
        Math.max(
          config.updateIntervalMs, 
          (dashboardData.rateLimit.remainingTime * 1000) + 1000
        )
      );
      console.log(`Rate limit low (${dashboardData.rateLimit.remaining} remaining), next update in ${nextUpdateMs/1000}s`);
    }
    
    // Schedule the next update
    console.log(`Next update in ${nextUpdateMs/1000} seconds`);
    setTimeout(updateDashboard, nextUpdateMs);
  }
}

// Initial update and interval polling
updateDashboard();
setInterval(updateDashboard, config.updateIntervalMs);

// API endpoint for dashboard data
app.get('/api/dashboard', (req, res) => {
  try {
    res.json({
      ...dashboardData,
      // Don't expose sensitive rate limit info to clients
      rateLimit: undefined
    });
  } catch (err) {
    logError('Error serving dashboard data:', err);
    res.status(500).json({
      error: 'Failed to fetch dashboard data',
      details: err.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    rateLimit: {
      ...dashboardData.rateLimit,
      limit: config.coinGecko.rateLimit,
      window: config.coinGecko.rateLimitWindow / 1000 + 's'
    },
    cache: {
      keys: cache.keys().length,
      stats: cache.getStats()
    }
  });
});

// Start server
const server = app.listen(config.port, () => {
  console.log(`Server running at http://localhost:${config.port}`);
  console.log(`Update interval: ${config.updateIntervalMs}ms`);
  console.log(`CoinGecko rate limit: ${config.coinGecko.rateLimit} requests per minute`);
  console.log(`Cache TTL: ${config.cache.ttl} seconds`);
});

// Handle graceful shutdown
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

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logError('Uncaught Exception:', err);
  // Don't crash the process, but log the error
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logError('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't crash the process, but log the error
});
