const config = require("./config");
const cache = require("./cache");
const { logError, fetchCoinData, fetchSPYData, fetchSPXData, rateLimit } = require("./api");
const { fetchTrending, fetchFearGreed } = require("./market");

let dashboardData = {
  btc: null,
  eth: null,
  spy: null,
  spx: null,
  trending: [],
  fearGreed: null,
  lastUpdated: null,
  error: null,
  rateLimit: { ...rateLimit }
};
async function updateDashboard() {
  const updateStartTime = Date.now();
  let updateError = null;
  
  try {
    console.log('Starting dashboard data update...');
    
    // Check rate limits before making new requests
    if (rateLimit.remaining <= 0) {
      const waitTime = rateLimit.remainingTime * 1000 + 1000; // Add 1 second buffer
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
    } else if (rateLimit.remaining < 5) {
      // If we're running low on rate limit, wait longer
      nextUpdateMs = Math.min(
        config.updateIntervalMs * 2,
        Math.max(
          config.updateIntervalMs,
          (rateLimit.remainingTime * 1000) + 1000
        )
      );
      console.log(`Rate limit low (${rateLimit.remaining} remaining), next update in ${nextUpdateMs/1000}s`);
    }
    
    dashboardData.rateLimit = { ...rateLimit };

    // Schedule the next update
    console.log(`Next update in ${nextUpdateMs/1000} seconds`);
    setTimeout(updateDashboard, nextUpdateMs);
  }
}


// Initial update and interval polling
updateDashboard();

module.exports = { dashboardData, updateDashboard };
