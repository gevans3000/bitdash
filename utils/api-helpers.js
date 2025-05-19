// utils/api-helpers.js
// Helper functions for API calls with retries and rate limiting

/**
 * Makes an API call with exponential backoff retries
 * @param {Function} apiCall - Async function that makes the API call
 * @param {Object} options - Options for retry behavior
 * @returns {Promise} - Result of the API call
 */
async function withRetry(apiCall, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    factor = 2,
  } = options;
  
  let attempt = 0;
  let delay = initialDelay;
  
  while (attempt < maxRetries) {
    try {
      return await apiCall();
    } catch (error) {
      attempt++;
      
      // If we've used all retries, throw the error
      if (attempt >= maxRetries) {
        throw error;
      }
      
      // For rate limiting errors, use the retry-after header if available
      if (error.response && error.response.status === 429 && error.response.headers['retry-after']) {
        const retryAfter = parseInt(error.response.headers['retry-after'], 10) * 1000;
        delay = Math.min(retryAfter || delay, maxDelay);
      } else {
        // Otherwise use exponential backoff
        delay = Math.min(delay * factor, maxDelay);
      }
      
      console.log(`API call failed, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Simple in-memory cache with expiration
 */
const cache = {
  data: {},
  
  /**
   * Get a value from cache
   * @param {string} key - Cache key
   * @returns {*} - Cached value or undefined if expired/not found
   */
  get(key) {
    const item = this.data[key];
    if (!item) return undefined;
    
    if (Date.now() > item.expiry) {
      delete this.data[key];
      return undefined;
    }
    
    return item.value;
  },
  
  /**
   * Set a value in cache
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds
   */
  set(key, value, ttl) {
    this.data[key] = {
      value,
      expiry: Date.now() + ttl
    };
  }
};

module.exports = { withRetry, cache };
