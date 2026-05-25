import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import SEOHelmet from "../components/SEOHelmet";
import Navbar from "../components/Navbar";
import PriceChart from "../components/PriceChart";
import { generateMarketData, generateNextPrice } from "../utils/marketMovement";

function Landing() {
  const navigate = useNavigate();
  const [minPrice, setMinPrice] = useState(2);
  const [maxPrice, setMaxPrice] = useState(4);
  const [basePrice, setBasePrice] = useState(3);
  const [price, setPrice] = useState(1);
  const [change, setChange] = useState(0);
  const [graphData, setGraphData] = useState([]);
  const [activePeriod, setActivePeriod] = useState("1D");

  const clampChange = (value) => Math.max(-80, Math.min(80, value));

  const formatINR = (value) => `₹${Number(value).toFixed(2)}`;

  const formatINRCompact = (value) => {
    const num = Number(value) || 0;
    if (num >= 1e9) return `₹${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `₹${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `₹${(num / 1e3).toFixed(2)}K`;
    return formatINR(num);
  };

  // Calculate 24h range based on dynamic price range
  const priceRange = maxPrice - minPrice;
  const priceLow24h = Math.max(minPrice, basePrice - priceRange * 0.08);
  const priceHigh24h = Math.min(maxPrice, basePrice + priceRange * 0.08);
  const rangeFill = priceHigh24h > priceLow24h
    ? Math.min(
        100,
        Math.max(0, ((price - priceLow24h) / (priceHigh24h - priceLow24h)) * 100)
      )
    : 0;

  // Fetch y-axis range from public API
  useEffect(() => {
    const fetchYAxisRange = async () => {
      try {
        const res = await API.get("/public/y-axis-range");
        if (res.data?.minYAxis !== undefined && res.data?.maxYAxis !== undefined) {
          const newMin = res.data.minYAxis;
          const newMax = res.data.maxYAxis;
          setMinPrice(newMin);
          setMaxPrice(newMax);
          setBasePrice((newMin + newMax) / 2);
          // Don't clamp price here - let coin-price API set the actual price
        }
      } catch (err) {
        console.error("Failed to fetch y-axis range:", err);
      }
    };

    // Fetch immediately
    fetchYAxisRange();
    
    // Fetch more frequently to reflect admin price changes
    const interval = setInterval(fetchYAxisRange, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchCoinPrice = async () => {
      try {
        // Add cache busting to ensure fresh data
        const res = await API.get("/public/coin-price?t=" + Date.now());
        const nextPrice = Number(res.data?.coinPrice);
        if (Number.isFinite(nextPrice) && isMounted) {
          // Set the actual price directly without clamping to y-axis range
          setPrice(nextPrice);
        }
      } catch (err) {
        console.error("Error fetching coin price:", err);
      }
    };

    // Fetch coin price with a small delay to ensure y-axis range is set first
    const timer = setTimeout(fetchCoinPrice, 100);
    
    // Fetch more frequently to reflect admin price changes
    const interval = setInterval(fetchCoinPrice, 2000);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  // Generate and update graph data with professional market movement
  useEffect(() => {
    const { data: initialData, changePercent } = generateMarketData(
      activePeriod,
      basePrice,
      minPrice,
      maxPrice
    );
    setGraphData(initialData);
    setChange(changePercent);

    // Live update: add new price point and remove oldest (sliding window effect)
    const liveUpdateInterval = setInterval(() => {
      setGraphData((prevData) => {
        if (prevData.length === 0) return prevData;

        const lastPrice = prevData[prevData.length - 1];
        const newPrice = generateNextPrice(
          lastPrice,
          minPrice,
          maxPrice,
          1.5 // volatility
        );

        const newData = [...prevData];
        newData.shift(); // Remove oldest point
        newData.push(newPrice); // Add newest point (slide left effect)

        return newData;
      });

      // Update percentage change gradually for realistic display
      setChange((prevChange) => {
        const fluctuation = (Math.random() - 0.5) * 0.1;
        return parseFloat((prevChange + fluctuation).toFixed(2));
      });
    }, 3000); // Update every 3 seconds for live trading feel

    return () => clearInterval(liveUpdateInterval);
  }, [activePeriod, basePrice, minPrice, maxPrice]);

  // Handle period change
  const handlePeriodChange = (period) => {
    setActivePeriod(period);
  };

  const historyRows = [
    {
      label: "1 Day",
      amount: price * (change / 100),
      pct: clampChange(change),
    },
    {
      label: "7 Days",
      amount: price * ((change * 2) / 100),
      pct: clampChange(change * 2),
    },
    {
      label: "30 Days",
      amount: price * ((change * 3) / 100),
      pct: clampChange(change * 3),
    },
  ];

  const performance = {
    allTimeHigh: maxPrice,
    allTimeLow: minPrice,
    change1h: clampChange(change * 0.4),
    change24h: clampChange(change),
    change7d: clampChange(change * 1.6),
  };

  const circulatingSupply = 12500000;
  const maxSupply = 100000000;
  const marketCap = price * circulatingSupply;
  const volume24h = marketCap * 0.22;

  const marketStats = {
    popularity: "#1",
    marketCap: formatINRCompact(marketCap),
    volume24h: formatINRCompact(volume24h),
    circulation: `${(circulatingSupply / 1e6).toFixed(2)}M ZUX`,
    maxSupply: `${(maxSupply / 1e6).toFixed(0)}M ZUX`,
    issueDate: "Jan 2025",
  };

  return (
    <>
      <SEOHelmet 
        title="ZUX Coin - Trade Digital Coins & Cryptocurrency | Secure Platform"
        description="Buy, trade, and manage digital coins on ZUX Coin. Activate for ₹7200, earn coins through referrals, and withdraw profits. Secure cryptocurrency trading platform."
        keywords="ZUX Coin, digital coins, cryptocurrency trading, crypto investment, blockchain, coin trading platform"
        url="https://zuxcoin.in"
      />
      <Navbar />

      <div className="binance-container">
        {/* LEFT SIDE */}
        <div className="left-section">
          <div className="coin-header">
            <h1>ZUX Coin (ZUX)</h1>
            <span className="hot-badge">HOT</span>
          </div>

          <div className="price-info">
            <h2>{formatINR(price)}</h2>
            <span className={change >= 0 ? "green" : "red"}>
              {change >= 0 ? "+" : ""}
              {change.toFixed(2)}%
            </span>
            <span className="period-label">{activePeriod}</span>
          </div>

          <div className="time-tabs">
            {["1D", "7D", "1M", "3M", "1Y"].map((period) => (
              <span
                key={period}
                className={activePeriod === period ? "active" : ""}
                onClick={() => handlePeriodChange(period)}
              >
                {period}
              </span>
            ))}
          </div>

          {/* GRAPH - Using Professional Crypto Exchange Chart */}
          <div className="chart-container">
            {graphData.length > 0 && (
              <PriceChart
                minPrice={minPrice}
                maxPrice={maxPrice}
                price={price}
                change={change}
                graphData={graphData}
                activePeriod={activePeriod}
                onPeriodChange={handlePeriodChange}
                yAxisLoading={false}
                showHeader={false}
              />
            )}
          </div>

          {/* PRICE HISTORY TABLE */}
          <div className="price-history">
            <h3>ZUX Price History (INR)</h3>
            <div className="history-table">
              <div className="table-header">
                <span>Date Comparison</span>
                <span>Amount Change</span>
                <span>% Change</span>
              </div>
              {historyRows.map((row) => {
                const isPositive = row.pct >= 0;
                const amountClass = isPositive ? "green" : "red";
                return (
                  <div key={row.label} className="table-row">
                    <span>{row.label}</span>
                    <span className={amountClass}>
                      {isPositive ? "+" : "-"} {formatINR(Math.abs(row.amount))}
                    </span>
                    <span className={amountClass}>
                      {isPositive ? "+" : "-"}{Math.abs(row.pct).toFixed(2)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CHART PERFORMANCE */}
          <div className="chart-performance">
            <h3>ZUX Chart Performance</h3>
            
            <div className="performance-item">
              <span className="label">24h Low & High</span>
              <div className="price-range">
                <span className="low-price">Low: {formatINR(priceLow24h)}</span>
                <div className="range-bar">
                  <div className="range-fill" style={{width: `${rangeFill}%`}}></div>
                </div>
                <span className="high-price">High: {formatINR(priceHigh24h)}</span>
              </div>
            </div>

            <div className="performance-grid">
              <div className="perf-box">
                <span className="perf-label">All Time High</span>
                <span className="perf-value">{formatINR(performance.allTimeHigh)}</span>
              </div>
              <div className="perf-box">
                <span className="perf-label">All Time Low</span>
                <span className="perf-value">{formatINR(performance.allTimeLow)}</span>
              </div>
              <div className="perf-box">
                <span className="perf-label">Price Change (1h)</span>
                <span className={`perf-value ${performance.change1h >= 0 ? "green" : "red"}`}>
                  {performance.change1h >= 0 ? "+" : "-"}{Math.abs(performance.change1h).toFixed(2)}%
                </span>
              </div>
              <div className="perf-box">
                <span className="perf-label">Price Change (24h)</span>
                <span className={`perf-value ${performance.change24h >= 0 ? "green" : "red"}`}>
                  {performance.change24h >= 0 ? "+" : "-"}{Math.abs(performance.change24h).toFixed(2)}%
                </span>
              </div>
              <div className="perf-box">
                <span className="perf-label">Price Change (7d)</span>
                <span className={`perf-value ${performance.change7d >= 0 ? "green" : "red"}`}>
                  {performance.change7d >= 0 ? "+" : "-"}{Math.abs(performance.change7d).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          {/* MARKET STATS */}
          <div className="market-stats">
            <h3>ZUX Market Stats</h3>
            <div className="stats-grid">
              <div className="stat-box">
                <span className="stat-label">Popularity</span>
                <span className="stat-value">{marketStats.popularity}</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">Market Cap</span>
                <span className="stat-value">{marketStats.marketCap}</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">Volume (24h)</span>
                <span className="stat-value">{marketStats.volume24h}</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">Circulation Supply</span>
                <span className="stat-value">{marketStats.circulation}</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">Total Maximum Supply</span>
                <span className="stat-value">{marketStats.maxSupply}</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">Issue Date</span>
                <span className="stat-value">{marketStats.issueDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE BUY PANEL */}
        <div className="buy-panel">
          <div className="right-panel-content">
            {/* BUY CARD */}
            <div className="buy-card">
              <h3>Get ZUX Card</h3>

              <div className="input-box">
                <label>You Pay</label>
                <div className="input-row">
                  <span>7200</span>
                  <span className="currency">INR</span>
                </div>
              </div>

              <button
                className="buy-btn"
                onClick={() => navigate("/signup")}
              >
                Get Your Card
              </button>
            </div>

            {/* REVIEWS SECTION */}
            <div className="reviews-section">
              <h3>Community Reviews</h3>
              <div className="reviews-list">
                <div className="review-card">
                  <div className="review-header">
                    <div className="reviewer-info">
                      <span className="reviewer-name">Rajesh Kumar</span>
                      <span className="review-time">2 days ago</span>
                    </div>
                    <span className="review-rating">⭐ 4.8</span>
                  </div>
                  <p className="review-text">
                    "Amazing project! ZUX coin has given me consistent returns. The dashboard is very user-friendly and transparent. Highly recommended for everyone!"
                  </p>
                </div>

                <div className="review-card">
                  <div className="review-header">
                    <div className="reviewer-info">
                      <span className="reviewer-name">Priya Singh</span>
                      <span className="review-time">1 day ago</span>
                    </div>
                    <span className="review-rating">⭐ 5.0</span>
                  </div>
                  <p className="review-text">
                    "Best investment decision I made this year! The ZUX team is very responsive and the community is growing rapidly. Keep it up! 🚀"
                  </p>
                </div>

                <div className="review-card">
                  <div className="review-header">
                    <div className="reviewer-info">
                      <span className="reviewer-name">Amit Patel</span>
                      <span className="review-time">5 hours ago</span>
                    </div>
                    <span className="review-rating">⭐ 4.9</span>
                  </div>
                  <p className="review-text">
                    "ZUX coin is revolutionizing the way we think about cryptocurrency. The wallet feature is seamless and secure. 5 stars!"
                  </p>
                </div>
              </div>
            </div>

            {/* LATEST NEWS SECTION */}
            <div className="news-section">
              <h3>Latest Updates</h3>
              <div className="news-list">
                <div className="news-card">
                  <div className="news-date">15 Feb</div>
                  <div className="news-content">
                    <h4>ZUX Coin Reaches 50K Active Users! 🎉</h4>
                    <p>Our community has grown to 50,000 active users in just 3 months! Thank you for your continued support.</p>
                  </div>
                </div>

                <div className="news-card">
                  <div className="news-date">14 Feb</div>
                  <div className="news-content">
                    <h4>New Trading Pair Listed!</h4>
                    <p>ZUX/INR trading pair is now live. Start trading with lower fees and faster transactions.</p>
                  </div>
                </div>

                <div className="news-card">
                  <div className="news-date">13 Feb</div>
                  <div className="news-content">
                    <h4>Price Surge +45% This Month 📈</h4>
                    <p>ZUX coin price has surged 45% this month, reflecting growing market confidence in our project.</p>
                  </div>
                </div>

                <div className="news-card">
                  <div className="news-date">12 Feb</div>
                  <div className="news-content">
                    <h4>Partnership Announcement 🤝</h4>
                    <p>Exciting news! ZUX has partnered with leading crypto exchanges for better liquidity.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Landing;
