/**
 * Market movement generator for professional crypto trading charts
 * Generates realistic price movement similar to real trading charts
 */

/**
 * Generates initial price data with realistic market-style movement
 * Creates true zig-zag patterns with frequent small ups and downs,
 * occasional spikes, and general trend (usually upward)
 */
export function generateMarketData(period, basePrice, minPrice, maxPrice) {
  let dataPoints = 60;
  let volatility = 1.6;
  let changePercent = 0;

  switch (period) {
    case "1D":
      changePercent = Math.random() * 6 + 1;
      break;
    case "7D":
      changePercent = Math.random() * 15 + 3;
      break;
    case "1M":
      changePercent = Math.random() * 25 + 5;
      break;
    case "3M":
      changePercent = Math.random() * 40 + 8;
      break;
    case "1Y":
      changePercent = Math.random() * 80 + 15;
      break;
    default:
      break;
  }

  const range = maxPrice - minPrice || 1;
  const data = [];

  // START NEAR BOTTOM LEFT
  let currentPrice =
    minPrice + range * (0.05 + Math.random() * 0.08);

  for (let i = 0; i < dataPoints; i++) {
    const progress = i / dataPoints;

    // upward trend
    const trend = changePercent / 100 * progress * range;

    // zig zag oscillation
    const zigzag =
      Math.sin(i * 0.9) * range * 0.05 +
      Math.sin(i * 0.35) * range * 0.08;

    // randomness
    const noise =
      (Math.random() - 0.5) * volatility * range * 0.03;

    // spikes
    let spike = 0;
    if (Math.random() > 0.94) {
      spike =
        (Math.random() > 0.5 ? 1 : -1) *
        Math.random() *
        range *
        0.12;
    }

    currentPrice =
      currentPrice +
      trend +
      zigzag +
      noise +
      spike;

    currentPrice = Math.min(
      maxPrice,
      Math.max(minPrice, currentPrice)
    );

    data.push(parseFloat(currentPrice.toFixed(2)));
  }

  return {
    data,
    changePercent: parseFloat(changePercent.toFixed(2)),
    volatility
  };
}

/**
 * Generates the next price point for live updates
 * Maintains realistic movement by considering last price and trend
 * Uses aggressive volatility to match initial data zigzag patterns
 */
export function generateNextPrice(lastPrice, minPrice, maxPrice, volatility = 3.2) {
  const range = maxPrice - minPrice || 1;

  // Large base movement for dramatic up-down swings
  let move =
    (Math.random() - 0.5) *
    range *
    0.12 *
    volatility;

  // Add sine wave oscillation for consistent zig-zag pattern
  const sineOscillation = 
    Math.sin(Math.random() * Math.PI * 2) * range * 0.08;

  move += sineOscillation;

  // Very frequent and large spikes for volatile movement
  if (Math.random() > 0.80) {
    move =
      (Math.random() > 0.5 ? 1 : -1) *
      Math.random() *
      range *
      (0.10 + Math.random() * 0.12);
  }

  const newPrice = lastPrice + move;

  return parseFloat(
    Math.min(maxPrice, Math.max(minPrice, newPrice)).toFixed(2)
  );
}

/**
 * Updates graph data for live trading chart effect
 * Removes oldest point and adds new point to maintain sliding window
 */
export function updateGraphData(prevData, newPrice) {
  const newData = [...prevData];
  newData.shift(); // Remove oldest point
  newData.push(newPrice); // Add newest point
  return newData;
}

/**
 * Clamps a price value to the valid min/max range
 * Prevents prices from going outside the chart bounds
 */
export function clampPrice(value, minPrice, maxPrice) {
  return Math.min(maxPrice, Math.max(minPrice, value));
}

/**
 * Calculates normalized height for a price using the professional formula
 * normalizedHeight = (price - minPrice) / (maxPrice - minPrice)
 * Returns value between 0 (at min) and 1 (at max)
 */
export function normalizePrice(price, minPrice, maxPrice) {
  const range = maxPrice - minPrice;
  if (range === 0) return 0.5; // Prevent division by zero
  return (price - minPrice) / range;
}

/**
 * Converts normalized height back to actual price
 * Inverse of normalizePrice function
 */
export function denormalizePrice(normalizedHeight, minPrice, maxPrice) {
  const range = maxPrice - minPrice;
  return minPrice + normalizedHeight * range;
}

export default {
  generateMarketData,
  generateNextPrice,
  updateGraphData,
  clampPrice,
  normalizePrice,
  denormalizePrice,
};
