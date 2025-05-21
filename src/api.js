const axios = require("axios");
const { sma, rsi, macd } = require("../utils/indicators");
const { findSwingHighsAndLows, groupPriceLevels } = require("../utils/supportResistance");
const { calculateBollingerBands } = require("../utils/bollingerBands");
const config = require("./config");
const cache = require("./cache");

let rateLimit = {
  remaining: config.coinGecko.rateLimit,
  limit: config.coinGecko.rateLimit,
  resetTime: 0,
  remainingTime: 0,
  lastUpdated: null,
};

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
      
      rateLimit = {
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
    if (rateLimit.remaining <= 2) {
      const waitTime = rateLimit.remainingTime * 1000 + 1000;
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

module.exports = {
  logError,
  updateRateLimitInfo,
  fetchCoinData,
  fetchSPYData,
  fetchSPXData,
  rateLimit,
};
