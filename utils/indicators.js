// utils/indicators.js
// Utility functions for SMA, RSI-14, MACD

// Simple Moving Average (SMA)
function sma(data, period) {
  const result = [];
  for (let i = 0; i <= data.length - period; i++) {
    const slice = data.slice(i, i + period);
    result.push(slice.reduce((a, b) => a + b, 0) / period);
  }
  return result;
}

// Relative Strength Index (RSI)
function rsi(data, period = 14) {
  const result = [];
  for (let i = period; i < data.length; i++) {
    let gains = 0, losses = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const diff = data[j] - data[j - 1];
      if (diff > 0) gains += diff;
      else losses -= diff;
    }
    const avgGain = gains / period;
    const avgLoss = losses / period;
    let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    result.push(100 - 100 / (1 + rs));
  }
  return result;
}

// MACD (12-26-9)
function macd(data, fast = 12, slow = 26, signal = 9) {
  const ema = (arr, period) => {
    const k = 2 / (period + 1);
    let emaArr = [arr[0]];
    for (let i = 1; i < arr.length; i++) {
      emaArr.push(arr[i] * k + emaArr[i - 1] * (1 - k));
    }
    return emaArr;
  };
  const fastEma = ema(data, fast);
  const slowEma = ema(data, slow);
  const macdArr = fastEma.map((v, i) => v - slowEma[i]);
  const signalArr = ema(macdArr.slice(slow - 1), signal);
  // Pad signal to align with macd
  const paddedSignal = Array(slow - 1 + signal - 1).fill(null).concat(signalArr);
  const histogram = macdArr.map((v, i) => paddedSignal[i] == null ? null : v - paddedSignal[i]);
  return { macd: macdArr, signal: paddedSignal, histogram };
}

module.exports = { sma, rsi, macd };
