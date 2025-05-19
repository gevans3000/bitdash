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
 * Groups nearby price levels and calculates their strength
 * @param {Array} levels - Array of price levels (highs and lows)
 * @param {number} threshold - Percentage threshold to group levels (0.01 = 1%)
 * @returns {Array} Array of grouped levels with strength
 */
function groupPriceLevels(levels, threshold = 0.01) {
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
            // Calculate average price and total strength for the group
            const avgPrice = currentGroup.reduce((sum, l) => sum + l.price, 0) / currentGroup.length;
            const strength = currentGroup.reduce((sum, l) => sum + (l.strength || 1), 0);
            
            result.push({
                price: avgPrice,
                strength: strength,
                touches: currentGroup.length,
                type: currentGroup[0].type, // All in group should be same type
                timestamps: currentGroup.map(l => l.timestamp)
            });
            
            // Start new group
            currentGroup = [level];
        }
    }
    
    // Add the last group
    if (currentGroup.length > 0) {
        const avgPrice = currentGroup.reduce((sum, l) => sum + l.price, 0) / currentGroup.length;
        const strength = currentGroup.reduce((sum, l) => sum + (l.strength || 1), 0);
        
        result.push({
            price: avgPrice,
            strength: strength,
            touches: currentGroup.length,
            type: currentGroup[0].type,
            timestamps: currentGroup.map(l => l.timestamp)
        });
    }
    
    return result;
}

module.exports = {
    findSwingHighsAndLows,
    groupPriceLevels
};
