const axios = require("axios");
const config = require("./config");
const cache = require("./cache");
const { logError, updateRateLimitInfo, rateLimit } = require("./api");

const coinGeckoApi = axios.create({
  baseURL: config.coinGecko.baseUrl,
  timeout: 10000,
  headers: config.coinGecko.apiKey
    ? { 'x-cg-pro-api-key': config.coinGecko.apiKey }
    : {},
});

const TRENDING_CACHE_KEY = 'trending_coins';
const FEAR_GREED_CACHE_KEY = 'fear_greed_index';

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
    if (rateLimit.remaining <= 2) {
      const waitTime = rateLimit.remainingTime * 1000 + 1000;
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


module.exports = {
  fetchTrending,
  fetchFearGreed,
  coinGeckoApi,
  TRENDING_CACHE_KEY,
  FEAR_GREED_CACHE_KEY,
};
