/**
 * Identifies swing highs and lows in price data
 * @param {Array} prices - Array of price objects with timestamp and price properties
 * @param {number} leftBars - Number of bars to the left to compare
 * @param {number} rightBars - Number of bars to the right to compare
 * @returns {Object} Object containing swingHighs and swingLows arrays
 */
function findSwingHighsAndLows(prices, leftBars = 3, rightBars = 3) {
    if (!Array.isArray(prices) || prices.length === 0) {
        return { swingHighs: [], swingLows: [] };
    }

    const swingHighs = [];
    const swingLows = [];

    // Helper function to check if a point is a swing high
    const isSwingHigh = (index) => {
        const current = prices[index];
        
        // Check left side
        for (let i = Math.max(0, index - leftBars); i < index; i++) {
            if (prices[i].price > current.price) {
                return false;
            }
        }
        
        // Check right side
        for (let i = index + 1; i <= Math.min(prices.length - 1, index + rightBars); i++) {
            if (prices[i].price >= current.price) {
                return false;
            }
        }
        
        return true;
    };

    // Helper function to check if a point is a swing low
    const isSwingLow = (index) => {
        const current = prices[index];
        
        // Check left side
        for (let i = Math.max(0, index - leftBars); i < index; i++) {
            if (prices[i].price < current.price) {
                return false;
            }
        }
        
        // Check right side
        for (let i = index + 1; i <= Math.min(prices.length - 1, index + rightBars); i++) {
            if (prices[i].price <= current.price) {
                return false;
            }
        }
        
        return true;
    };

    // Find all swing highs and lows
    for (let i = leftBars; i < prices.length - rightBars; i++) {
        if (isSwingHigh(i)) {
            swingHighs.push({
                ...prices[i],
                type: 'high',
                strength: 1 // Will be updated based on touches
            });
        } else if (isSwingLow(i)) {
            swingLows.push({
                ...prices[i],
                type: 'low',
                strength: 1 // Will be updated based on touches
            });
        }
    }


    return { swingHighs, swingLows };
}

/**
 * Calculates time decay factor for a timestamp
 * @param {number} timestamp - Timestamp to calculate decay for
 * @param {number} halfLife - Time in ms for strength to halve (default: 30 days)
 * @returns {number} Decay factor between 0 and 1
 */
function calculateTimeDecay(timestamp, halfLife = 30 * 24 * 60 * 60 * 1000) {
    const now = Date.now();
    const age = now - timestamp;
    return Math.pow(0.5, age / halfLife);
}

/**
 * Groups nearby price levels using advanced clustering
 * @param {Array} levels - Array of price levels with volume and timestamp
 * @param {Object} options - Configuration options
 * @param {number} options.threshold - Price threshold as decimal (0.01 = 1%)
 * @param {boolean} options.volumeWeighted - Whether to use volume weighting
 * @param {boolean} options.timeDecay - Whether to apply time decay
 * @returns {Array} Array of grouped levels with strength metrics
 */
function groupPriceLevels(levels, {
    threshold = 0.01,
    volumeWeighted = true,
    timeDecay = true
} = {}) {
    if (!levels.length) return [];
    
    // Sort levels by price
    const sorted = [...levels].sort((a, b) => a.price - b.price);
    const result = [];
    let currentGroup = [sorted[0]];
    
    for (let i = 1; i < sorted.length; i++) {
        const level = sorted[i];
        const lastInGroup = currentGroup[currentGroup.length - 1];
        
        // Check if current level is within threshold of the last level in current group
        if (Math.abs((level.price - lastInGroup.price) / lastInGroup.price) <= threshold) {
            currentGroup.push(level);
        } else {
            // Process the current group
            processGroup(currentGroup, result, { volumeWeighted, timeDecay });
            // Start new group
            currentGroup = [level];
        }
    }
    
    // Process the last group
    if (currentGroup.length > 0) {
        processGroup(currentGroup, result, { volumeWeighted, timeDecay });
    }
    
    // Sort by strength in descending order
    return result.sort((a, b) => b.strength - a.strength);
}

/**
 * Processes a group of similar price levels into a single level
 * @private
 */
function processGroup(levels, result, { volumeWeighted, timeDecay }) {
    if (!levels.length) return;
    
    // Calculate volume-weighted average price if volume data is available
    let totalVolume = 0;
    let totalValue = 0;
    let totalStrength = 0;
    let maxVolume = 0;
    const now = Date.now();
    
    levels.forEach(level => {
        const volume = level.volume || 1; // Default to 1 if no volume data
        const timeFactor = timeDecay ? calculateTimeDecay(level.timestamp || now) : 1;
        const weight = volumeWeighted ? volume * timeFactor : timeFactor;
        
        totalValue += level.price * weight;
        totalVolume += volume;
        totalStrength += (level.strength || 1) * timeFactor;
        maxVolume = Math.max(maxVolume, volume);
    });
    
    const avgPrice = volumeWeighted 
        ? totalValue / (volumeWeighted ? totalVolume : levels.length)
        : levels.reduce((sum, l) => sum + l.price, 0) / levels.length;
    
    // Calculate strength based on number of touches, volume, and recency
    const baseStrength = Math.sqrt(levels.length); // Diminishing returns on more touches
    const volumeFactor = Math.log10(maxVolume + 1) * 0.5 + 1; // Log scale for volume
    const strength = baseStrength * volumeFactor * (volumeWeighted ? 1.0 : 0.8);
    
    // Get most recent timestamp
    const latestTimestamp = Math.max(...levels.map(l => l.timestamp || 0));
    
    result.push({
        price: avgPrice,
        strength: strength,
        touches: levels.length,
        type: levels[0].type, // All in group should be same type
        volume: totalVolume,
        maxVolume: maxVolume,
        lastTouch: latestTimestamp,
        firstTouch: Math.min(...levels.map(l => l.timestamp || now)),
        timestamps: levels.map(l => l.timestamp).filter(Boolean)
    });
}

module.exports = {
    findSwingHighsAndLows,
    groupPriceLevels
};
