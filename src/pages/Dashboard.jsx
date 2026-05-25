// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import API from "../api";
// import Navbar from "../components/Navbar";
// import SellCoinModal from "../components/SellCoinModal";
// import TransferHistory from "../components/TransferHistory";
// import IncomingTransfers from "../components/IncomingTransfers";
// import LoadingSpinner from "../components/LoadingSpinner";
// import PriceChart from "../components/PriceChart";
// import { generateMarketData, generateNextPrice } from "../utils/marketMovement";

// function Dashboard() {
//   const [data, setData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const navigate = useNavigate();
//   const [showSellCoinModal, setShowSellCoinModal] = useState(false);
//   const [showTransferHistory, setShowTransferHistory] = useState(false);
//   const [refreshKey, setRefreshKey] = useState(0);
  
//   // Graph state
//   const [minPrice, setMinPrice] = useState(1);
//   const [maxPrice, setMaxPrice] = useState(2);
//   const [basePrice, setBasePrice] = useState(1.5);
//   const [price, setPrice] = useState(1.5);
//   const [change, setChange] = useState(0);
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import SEOHelmet from "../components/SEOHelmet";
import Navbar from "../components/Navbar";
import SellCoinModal from "../components/SellCoinModal";
import TransferHistory from "../components/TransferHistory";
import IncomingTransfers from "../components/IncomingTransfers";
import LoadingSpinner from "../components/LoadingSpinner";
import PriceChart from "../components/PriceChart";
import { generateMarketData, generateNextPrice } from "../utils/marketMovement";

function Dashboard() {
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);
	const navigate = useNavigate();
	const [showSellCoinModal, setShowSellCoinModal] = useState(false);
	const [showTransferHistory, setShowTransferHistory] = useState(false);
	const [refreshKey, setRefreshKey] = useState(0);
  
	// Graph state
	const [minPrice, setMinPrice] = useState(1);
	const [maxPrice, setMaxPrice] = useState(2);
	const [basePrice, setBasePrice] = useState(1.5);
	const [price, setPrice] = useState(1.5);
	const [change, setChange] = useState(0);
	const [graphData, setGraphData] = useState([]);
	const [activePeriod, setActivePeriod] = useState("1D");
	const [yAxisLoading, setYAxisLoading] = useState(true);

	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true);
				const res = await API.get("/user/dashboard");
				setData(res.data);
        
				// Redirect admins to admin dashboard
				if (res.data.user.role === "admin") {
					navigate("/admin");
					return;
				}
			} catch (error) {
				console.error("Failed to fetch dashboard data:", error);
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, [navigate]);

	useEffect(() => {
		// Redirect admins to admin dashboard
		if (data?.user?.role === "admin") {
			navigate("/admin");
			return;
		}
	}, [data, navigate]);

	// Fetch Y-Axis range from public API
	useEffect(() => {
		const fetchYAxisRange = async () => {
			try {
				setYAxisLoading(true);
				const res = await API.get("/public/y-axis-range");
				const min = res.data.minYAxis || 1;
				const max = res.data.maxYAxis || 2;
				setMinPrice(min);
				setMaxPrice(max);
				setBasePrice((min + max) / 2);
				// Don't update price here - let coin-price API set the actual price
			} catch (error) {
				console.error("Failed to fetch y-axis range:", error);
				// Keep default values on error
				setMinPrice(1);
				setMaxPrice(2);
				setBasePrice(1.5);
			} finally {
				setYAxisLoading(false);
			}
		};
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
					// Set the actual price directly without clamping
					setPrice(nextPrice);
				}
			} catch (error) {
				// Keep last known price on failure
			}
		};

		// Fetch immediately with small delay to ensure ranges are set
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
		// Updates every 2 seconds for visible smooth changes
		const liveUpdateInterval = setInterval(() => {
			setGraphData((prevData) => {
				if (prevData.length === 0) return prevData;

				const lastPrice = prevData[prevData.length - 1];
				// High volatility for aggressive up-down swings
				const newPrice = generateNextPrice(
					lastPrice,
					minPrice,
					maxPrice,
					4.5 // very high volatility
				);

				const newData = [...prevData];
				newData.shift(); // Remove oldest point
				newData.push(newPrice); // Add newest point (slide left effect)

				return newData;
			});

			// Update percentage change gradually for realistic display
			setChange((prevChange) => {
				const fluctuation = (Math.random() - 0.5) * 0.05;
				return parseFloat((prevChange + fluctuation).toFixed(2));
			});
		}, 2000); // Update every 2 seconds for visible gradual changes

		return () => clearInterval(liveUpdateInterval);
	}, [activePeriod, basePrice, minPrice, maxPrice]);

	// Handle period change
	const handlePeriodChange = (period) => {
		setActivePeriod(period);
	};

	if (loading || !data) {
		return (
			<>
				<Navbar />
				<LoadingSpinner fullScreen message="Loading dashboard..." />
			</>
		);
	}

	const { user, directReferrals, activeBelow } = data;

	const referralLink = `${window.location.origin}/signup?ref=${user.referralCode}`;

	const copyLink = () => {
		if (!user.isActivated) {
			alert("Please activate your account for getting referral code");
			return;
		}
		navigator.clipboard.writeText(referralLink);
		alert("Referral link copied!");
	};

	return (
		<>
			<SEOHelmet 
				title="User Dashboard - ZUX Coin | Manage Your Coins & Wallet"
				description="Access your ZUX Coin dashboard to view wallet balance, coin holdings, referral network, and manage your cryptocurrency investments."
				keywords="dashboard, wallet, coins, balance, user dashboard, portfolio"
				url="https://zuxcoin.in/dashboard"
			/>
			<Navbar user={user} />

			<div className="dashboard-container">
				<div className="dashboard-header">
					<h1 className="auth-title">User Dashboard</h1>
					{!user.isActivated && (
						<span className="status-badge inactive">🔴 Inactive Account</span>
					)}
					{user.isActivated && (
						<span className="status-badge active">✓ Active Account</span>
					)}
				</div>

				{/* ACTIVATION CARD FOR INACTIVE USERS */}
				{!user.isActivated && (
					<div className="activation-card">
						<div className="activation-content">
							<div className="activation-icon">🔐</div>
							<div className="activation-text">
								<h3>Activate Your Account</h3>
								<p>Unlock all features including referral rewards, coin transfers, and withdrawals</p>
								<ul className="activation-benefits">
									<li>✓ Get referral code & share earnings</li>
									<li>✓ Accept coin transfer requests</li>
									<li>✓ Withdraw coins & money</li>
									<li>✓ Unlock milestone rewards</li>
								</ul>
							</div>
						</div>
						<button 
							className="activation-btn"
							onClick={() => navigate("/get-card")}
						>
							Activate Now
						</button>
					</div>
				)}

				{/* WALLET CARDS */}
				<div className="wallet-grid">
					<div className="wallet-card">
						<h4>Your Wallet</h4>
						<h2>₹ {user.bonusWallet?.toFixed?.(2) || 0}</h2>
					</div>

					<div className="wallet-card">
						<h4>Total Coins</h4>
						<h2>{user.coins?.toFixed?.(2) || 0}</h2>
						<p className="coin-info">
							Daily Limit: 10% Coins
						</p>
					</div>

					<div className="wallet-card">
						<h4>Your ID</h4>
						<h2>{user.uniqueId || "-"}</h2>
					</div>
				</div>

				{/* QUICK ACTIONS */}
				<div className="quick-actions">
					<h3>Quick Actions</h3>

					<div className="quick-grid">
						<button
							className="quick-btn withdraw"
							onClick={() => navigate("/withdrawal?tab=coin")}
						>
							💰 Coin Withdraw
						</button>

						<button
							className="quick-btn bonus"
							onClick={() => navigate("/withdrawal?tab=bonus")}
						>
							🎁 Money Withdraw
						</button>

						<button
							className="quick-btn transactions"
							onClick={() => navigate("/transactions")}
						>
							📜 Transactions
						</button>

						<button
							className="quick-btn referral"
							onClick={copyLink}
							disabled={!user.isActivated}
							title={!user.isActivated ? "Please activate your account" : ""}
						>
							🔗 Referral
						</button>

						<button
							className="quick-btn sell-coin"
							onClick={() => setShowSellCoinModal(true)}
						>
							💸 Sell Coin
						</button>

						<button
							className="quick-btn history"
							onClick={() => setShowTransferHistory(true)}
						>
							📋 Transfer History
						</button>

						<button
							className="quick-btn genealogy"
							onClick={() => navigate("/genealogy", { replace: false })}
						>
							🌳 Genealogy
						</button>

						<button
							className="quick-btn bank-details"
							onClick={() => navigate("/bank-details")}
						>
							🏦 Bank Details
						</button>
					</div>
				</div>

				{/* INCOMING TRANSFERS */}
				<IncomingTransfers key={refreshKey} onTransfersUpdate={() => setRefreshKey((k) => k + 1)} />

				{/* ZUX PRICE CHART - Professional Crypto Exchange Style */}
				<PriceChart
					minPrice={minPrice}
					maxPrice={maxPrice}
					price={price}
					change={change}
					graphData={graphData}
					activePeriod={activePeriod}
					onPeriodChange={handlePeriodChange}
					yAxisLoading={yAxisLoading}
				/>

				{/* MLM INFO */}
				<div className="mlm-grid">
					<div className="info-card">
						<h4>Your Position</h4>
						<p>{user.position || "Not Activated"}</p>
					</div>

					<div className="info-card">
						<h4>Active IDs Below</h4>
						<p>{activeBelow}</p>
					</div>

					<div className="info-card">
						<h4>Direct Referrals</h4>
						<p>{directReferrals}</p>
					</div>
				</div>

				<div className="genealogy-dashboard-section">
					<div className="genealogy-toggle"></div>
				</div>

				{/* MILESTONE PROGRESS */}
				<div className="milestone-card">
					<h3>Milestone Progress</h3>

				<ProgressBar label="50 IDs - ₹500" value={activeBelow} target={50} achieved={data?.user?.milestones?.m50} />
				<ProgressBar label="100 IDs - ₹1000" value={activeBelow} target={100} achieved={data?.user?.milestones?.m100} />
				<ProgressBar label="250 IDs - ₹3500" value={activeBelow} target={250} achieved={data?.user?.milestones?.m250} />
				<ProgressBar label="500 IDs - ₹7500" value={activeBelow} target={500} achieved={data?.user?.milestones?.m500} />
				<ProgressBar label="1000 IDs - ₹15000" value={activeBelow} target={1000} achieved={data?.user?.milestones?.m1000} />
				<ProgressBar label="2500 IDs - ₹40000" value={activeBelow} target={2500} achieved={data?.user?.milestones?.m2500} />
					
				{/* REFERRAL LINK SECTION - Only show for activated users */}
				{user.isActivated && (
					<div className="referral-section">
						<h3>Your Referral Link</h3>
						<p className="ref-link">{referralLink}</p>
						<button onClick={copyLink} className="copy-btn">Copy Link</button>
					</div>
				)}

				{!user.isActivated && (
					<div className="referral-section-inactive">
						<h3>Referral Program</h3>
						<p className="inactive-message">
							🔒 Activate your account to get your unique referral code and start earning from your network.
						</p>
						<button 
							className="activate-for-referral-btn"
							onClick={() => navigate("/get-card")}
						>
							Activate Now to Get Referral Code
						</button>
					</div>
				)}
				</div>

			</div>

			<SellCoinModal
				isOpen={showSellCoinModal}
				onClose={() => setShowSellCoinModal(false)}
				userBalance={data?.user?.coins || 0}
				onSubmit={() => {
					// Refresh incoming transfers
					setRefreshKey((k) => k + 1);
					// Optionally refresh dashboard data
					setTimeout(() => {
						const fetchData = async () => {
							const res = await API.get("/user/dashboard");
							setData(res.data);
						};
						fetchData();
					}, 1500);
				}}
				isLoading={false}
			/>

			<TransferHistory
				isOpen={showTransferHistory}
				onClose={() => setShowTransferHistory(false)}
			/>
		</>
	);
}

function ProgressBar({ label, value, target, achieved }) {
	const percentage = Math.min((value / target) * 100, 100);

	return (
		<div className="progress-item">
			<div className="progress-label-row">
				<p>{label}</p>
				{achieved && <span className="milestone-achieved">✓ Achieved</span>}
			</div>
			<div className="progress-bar">
				<div
					className="progress-fill"
					style={{ width: `${percentage}%` }}
				></div>
			</div>
			<p className="progress-count">{value} / {target}</p>
		</div>
	);
}

export default Dashboard;
