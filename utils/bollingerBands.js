/**
 * Calculates standard deviation of an array of numbers
 * @param {number[]} values - Array of numbers
 * @returns {number} Standard deviation
 */
function standardDeviation(values) {
  const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squareDiffs = values.map(val => Math.pow(val - avg, 2));
  return Math.sqrt(squareDiffs.reduce((sum, val) => sum + val, 0) / values.length);
}

/**
 * Calculates Bollinger Bands for a given price series
 * @param {number[]} prices - Array of price values
 * @param {number} period - Number of periods for the moving average (default: 20)
 * @param {number} stdDev - Number of standard deviations for the bands (default: 2)
 * @returns {Object} Object containing upper, middle, and lower bands
 */
function calculateBollingerBands(prices, period = 20, stdDev = 2) {
  if (prices.length < period) {
    return {
      upper: [],
      middle: [],
      lower: [],
      bandwidth: [],
      percentB: []
    };
  }

  const middle = [];
  const upper = [];
  const lower = [];
  const bandwidth = [];
  const percentB = [];

  // Calculate SMA (middle band) and standard deviation for each period
  for (let i = period - 1; i < prices.length; i++) {
    const slice = prices.slice(i - period + 1, i + 1);
    const sma = slice.reduce((sum, val) => sum + val, 0) / period;
    const std = standardDeviation(slice);
    
    middle.push(sma);
    upper.push(sma + std * stdDev);
    lower.push(sma - std * stdDev);
    
    // Calculate %B (percent b)
    const currentPrice = prices[i];
    const bValue = (currentPrice - lower[lower.length - 1]) / (upper[upper.length - 1] - lower[lower.length - 1]);
    percentB.push(bValue * 100); // Convert to percentage
    
    // Calculate Bandwidth
    bandwidth.push((upper[upper.length - 1] - lower[lower.length - 1]) / sma * 100);
  }

  return {
    upper,
    middle,
    lower,
    bandwidth,
    percentB,
    lastUpdate: new Date().toISOString()
  };
}

module.exports = {
  standardDeviation,
  calculateBollingerBands
};
