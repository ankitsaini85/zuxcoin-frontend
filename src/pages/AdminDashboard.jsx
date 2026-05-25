import { useEffect, useState } from "react";
import API from "../api";
import SEOHelmet from "../components/SEOHelmet";
import Navbar from "../components/Navbar";
import AdminGenealogy from "./AdminGenealogy";
import LoadingSpinner from "../components/LoadingSpinner";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

const getEffectiveBankDetails = (request, userBankDetails = null) => {
  if (!request) return {};
  return (
    request.effectiveBankDetails ||
    request.userId?.bankDetails ||
    userBankDetails ||
    request.bankDetailsSnapshot ||
    {}
  );
};

const hasBankDetails = (details = {}) => {
  return Boolean(
    details.accountHolderName ||
      details.bankName ||
      details.accountNumber ||
      details.branch ||
      details.ifscCode ||
      details.upiId ||
      details.qrImage
  );
};

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [requests, setRequests] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userStatus, setUserStatus] = useState("all");
  const [userSearch, setUserSearch] = useState("");
  const [walletEdits, setWalletEdits] = useState({});
  const [coinEdits, setCoinEdits] = useState({});
  const [passwordEdits, setPasswordEdits] = useState({});
  const [userActionLoading, setUserActionLoading] = useState(null);
  const [activeSection, setActiveSection] = useState("overview");
  const [coinPrice, setCoinPrice] = useState(null);
  const [coinPriceInput, setCoinPriceInput] = useState("");
  const [coinPriceLoading, setCoinPriceLoading] = useState(false);
  const [activationFee, setActivationFee] = useState(null);
  const [activationFeeInput, setActivationFeeInput] = useState("");
  const [activationFeeLoading, setActivationFeeLoading] = useState(false);
  const [minYAxis, setMinYAxis] = useState(null);
  const [maxYAxis, setMaxYAxis] = useState(null);
  const [minYAxisInput, setMinYAxisInput] = useState("");
  const [maxYAxisInput, setMaxYAxisInput] = useState("");
  const [yAxisRangeLoading, setYAxisRangeLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [expandedWithdrawalId, setExpandedWithdrawalId] = useState(null);
  const [expandedBankDetailsId, setExpandedBankDetailsId] = useState(null);

  const showToast = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3500);
  };

  const fetchData = async () => {
    try {
      const statsRes = await API.get("/admin/stats");
      setStats(statsRes.data);

      const chartRes = await API.get("/admin/revenue-chart");
      setChartData(chartRes.data);

      const requestsRes = await API.get("/withdrawal/all");
      const requestsData =
        requestsRes.data.withdrawals || requestsRes.data;
      setRequests(Array.isArray(requestsData) ? requestsData : []);

      const userRes = await API.get("/user/profile");
      setUser(userRes.data);
    } catch (err) {
      console.error("Error fetching data:", err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchUsers();
    fetchCoinPrice();
    fetchActivationFee();
    fetchYAxisRange();
  }, []);

  const fetchCoinPrice = async () => {
    try {
      const res = await API.get("/admin/coin-price");
      setCoinPrice(res.data.coinPrice);
      setCoinPriceInput(res.data.coinPrice?.toString() || "");
    } catch (err) {
      console.error("Error fetching coin price:", err);
    }
  };

  const fetchActivationFee = async () => {
    try {
      const res = await API.get("/admin/activation-fee");
      setActivationFee(res.data.activationFee);
      setActivationFeeInput(res.data.activationFee?.toString() || "");
    } catch (err) {
      console.error("Error fetching activation fee:", err);
    }
  };

  const fetchYAxisRange = async () => {
    try {
      const res = await API.get("/admin/y-axis-range");
      setMinYAxis(res.data.minYAxis);
      setMaxYAxis(res.data.maxYAxis);
      setMinYAxisInput(res.data.minYAxis?.toString() || "");
      setMaxYAxisInput(res.data.maxYAxis?.toString() || "");
    } catch (err) {
      console.error("Error fetching y-axis range:", err);
    }
  };

  const fetchUsers = async (override = {}) => {
    setUsersLoading(true);
    try {
      const status = override.status ?? userStatus;
      const searchValue = override.q ?? userSearch;
      const res = await API.get("/admin/users", {
        params: {
          status,
          q: searchValue.trim() || undefined,
        },
      });
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching users:", err);
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  const approve = async (id) => {
    if (!window.confirm("Approve this withdrawal?")) return;
    setProcessing(id);
    try {
      await API.post("/withdrawal/approve", { requestId: id });
      fetchData();
      showToast("Withdrawal approved");
    } catch (err) {
      showToast(err.response?.data?.message || err.message, "error");
    } finally {
      setProcessing(null);
    }
  };

  const reject = async (id) => {
    if (!window.confirm("Reject this withdrawal?")) return;
    setProcessing(id);
    try {
      await API.post("/withdrawal/reject", { requestId: id });
      fetchData();
      showToast("Withdrawal rejected");
    } catch (err) {
      showToast(err.response?.data?.message || err.message, "error");
    } finally {
      setProcessing(null);
    }
  };

  const handleWalletChange = (userId, value) => {
    setWalletEdits((prev) => ({ ...prev, [userId]: value }));
  };

  const handlePasswordChange = (userId, value) => {
    setPasswordEdits((prev) => ({ ...prev, [userId]: value }));
  };

  const handleCoinChange = (userId, value) => {
    setCoinEdits((prev) => ({ ...prev, [userId]: value }));
  };

  const updateWallet = async (userId) => {
    const walletValue = walletEdits[userId];
    if (walletValue === undefined || walletValue === "") {
      showToast("Enter a wallet balance", "error");
      return;
    }

    setUserActionLoading(userId);
    try {
      await API.patch(`/admin/users/${userId}/wallet`, {
        bonusWallet: Number(walletValue),
      });
      await fetchUsers();
      setWalletEdits((prev) => ({ ...prev, [userId]: "" }));
      showToast("Wallet updated");
    } catch (err) {
      showToast(err.response?.data?.message || err.message, "error");
    } finally {
      setUserActionLoading(null);
    }
  };

  const updateCoinWallet = async (userId) => {
    const coinValue = coinEdits[userId];
    if (coinValue === undefined || coinValue === "") {
      showToast("Enter a coin wallet balance", "error");
      return;
    }

    const parsedCoins = Number(coinValue);
    if (!Number.isFinite(parsedCoins) || parsedCoins < 0) {
      showToast("Enter a valid coin wallet balance", "error");
      return;
    }

    setUserActionLoading(userId);
    try {
      await API.patch(`/admin/users/${userId}/wallet`, {
        coins: parsedCoins,
      });
      await fetchUsers();
      setCoinEdits((prev) => ({ ...prev, [userId]: "" }));
      showToast("Coin wallet updated");
    } catch (err) {
      showToast(err.response?.data?.message || err.message, "error");
    } finally {
      setUserActionLoading(null);
    }
  };

  const updatePassword = async (userId) => {
    const passwordValue = passwordEdits[userId];
    if (!passwordValue) {
      showToast("Enter a new password", "error");
      return;
    }

    setUserActionLoading(userId);
    try {
      await API.patch(`/admin/users/${userId}/password`, {
        password: passwordValue,
      });
      setPasswordEdits((prev) => ({ ...prev, [userId]: "" }));
      showToast("Password updated");
    } catch (err) {
      showToast(err.response?.data?.message || err.message, "error");
    } finally {
      setUserActionLoading(null);
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm("Delete this user? This action cannot be undone.")) return;

    setUserActionLoading(userId);
    try {
      await API.delete(`/admin/users/${userId}`);
      await fetchUsers();
      showToast("User deleted");
    } catch (err) {
      showToast(err.response?.data?.message || err.message, "error");
    } finally {
      setUserActionLoading(null);
    }
  };

  const updateCoinPrice = async () => {
    const value = Number(coinPriceInput);
    if (!Number.isFinite(value) || value <= 0) {
      showToast("Enter a valid coin price", "error");
      return;
    }

    setCoinPriceLoading(true);
    try {
      const res = await API.patch("/admin/coin-price", {
        coinPrice: value,
      });
      setCoinPrice(res.data.coinPrice);
      setCoinPriceInput(res.data.coinPrice.toString());
      await fetchUsers();
      showToast("Coin price updated");
    } catch (err) {
      showToast(err.response?.data?.message || err.message, "error");
    } finally {
      setCoinPriceLoading(false);
    }
  };

  const updateActivationFee = async () => {
    const value = Number(activationFeeInput);
    if (!Number.isFinite(value) || value <= 0) {
      showToast("Enter a valid activation fee", "error");
      return;
    }

    setActivationFeeLoading(true);
    try {
      const res = await API.patch("/admin/activation-fee", {
        activationFee: value,
      });
      setActivationFee(res.data.activationFee);
      setActivationFeeInput(res.data.activationFee.toString());
      showToast("Activation fee updated");
    } catch (err) {
      showToast(err.response?.data?.message || err.message, "error");
    } finally {
      setActivationFeeLoading(false);
    }
  };

  const updateYAxisRange = async () => {
    const minValue = Number(minYAxisInput);
    const maxValue = Number(maxYAxisInput);

    if (!Number.isFinite(minValue) || !Number.isFinite(maxValue)) {
      showToast("Enter valid Y-axis range values", "error");
      return;
    }

    if (minValue >= maxValue) {
      showToast("Minimum value must be less than maximum value", "error");
      return;
    }

    setYAxisRangeLoading(true);
    try {
      const res = await API.patch("/admin/y-axis-range", {
        minYAxis: minValue,
        maxYAxis: maxValue,
      });
      setMinYAxis(res.data.minYAxis);
      setMaxYAxis(res.data.maxYAxis);
      setMinYAxisInput(res.data.minYAxis.toString());
      setMaxYAxisInput(res.data.maxYAxis.toString());
      showToast("Y-axis range updated");
    } catch (err) {
      showToast(err.response?.data?.message || err.message, "error");
    } finally {
      setYAxisRangeLoading(false);
    }
  };

  if (loading)
    return (
      <>
        <Navbar />
        <LoadingSpinner fullScreen message="Loading admin dashboard..." />
      </>
    );

  if (!stats)
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        No data available
      </div>
    );

  return (
    <>
      <SEOHelmet 
        title="Admin Dashboard - ZUX Coin | System Management & Analytics"
        description="Admin panel for ZUX Coin system management. Analytics, user management, withdrawal approvals, and system settings."
        keywords="admin, admin dashboard, management, analytics, system settings"
        url="https://zuxcoin.in/admin"
      />
      <Navbar user={user} />

      <div className="admin-dashboard">
        <div className="toast-container">
          {toasts.map((toast) => (
            <div key={toast.id} className={`toast ${toast.type}`}>
              {toast.message}
            </div>
          ))}
        </div>
        <div className="admin-layout">
          <aside className="admin-sidebar">
            <h2>Admin Panel</h2>
            <button
              className={`sidebar-btn ${activeSection === "overview" ? "active" : ""}`}
              onClick={() => setActiveSection("overview")}
            >
              Overview
            </button>
            <button
              className={`sidebar-btn ${activeSection === "analytics" ? "active" : ""}`}
              onClick={() => setActiveSection("analytics")}
            >
              Analytics
            </button>
            <button
              className={`sidebar-btn ${activeSection === "withdrawals" ? "active" : ""}`}
              onClick={() => setActiveSection("withdrawals")}
            >
              Withdrawals
            </button>
            <button
              className={`sidebar-btn ${activeSection === "users" ? "active" : ""}`}
              onClick={() => setActiveSection("users")}
            >
              User Management
            </button>
            <button
              className={`sidebar-btn ${activeSection === "genealogy" ? "active" : ""}`}
              onClick={() => setActiveSection("genealogy")}
            >
              Genealogy
            </button>
            <button
              className={`sidebar-btn ${activeSection === "settings" ? "active" : ""}`}
              onClick={() => setActiveSection("settings")}
            >
              Settings
            </button>
          </aside>

          <section className="admin-content">
            {activeSection === "overview" && (
              <div className="admin-section">
                <h3>Enterprise Analytics Dashboard</h3>
                <div className="admin-grid">
                  <StatCard title="Total Users" value={stats.totalUsers} />
                  <StatCard title="Active Users" value={stats.activeUsers} />
                  <StatCard title="Inactive Users" value={stats.inactiveUsers} />
                  <StatCard title="Total Revenue" value={`₹ ${stats.totalRevenue}`} />
                  <StatCard title="Direct Bonus" value={`₹ ${stats.totalDirectBonus}`} />
                  <StatCard title="Milestone Bonus" value={`₹ ${stats.totalMilestoneBonus}`} />
                  <StatCard title="Withdrawals" value={`₹ ${stats.totalWithdrawals}`} />
                  <StatCard title="Pending Withdrawals" value={`₹ ${stats.totalPendingWithdrawals}`} />
                  <StatCard title="System Net Balance" value={`₹ ${stats.systemBalance}`} highlight />
                </div>
              </div>
            )}

            {activeSection === "analytics" && chartData && (
              <div className="admin-section">
                <h3>Revenue vs Withdrawals (Last 30 Days)</h3>
                <div className="chart-section">
                  <Line
                    data={{
                      labels: chartData.labels,
                      datasets: [
                        {
                          label: "Revenue",
                          data: chartData.revenueValues,
                          borderColor: "#0ecb81",
                          backgroundColor: "rgba(14, 203, 129, 0.1)",
                          tension: 0.3,
                          fill: true,
                        },
                        {
                          label: "Withdrawals",
                          data: chartData.withdrawalValues,
                          borderColor: "#f6465d",
                          backgroundColor: "rgba(246, 70, 93, 0.1)",
                          tension: 0.3,
                          fill: true,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          labels: { color: "#fff" },
                        },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              return context.dataset.label + ': ₹' + context.parsed.y.toFixed(2);
                            }
                          }
                        }
                      },
                      scales: {
                        x: {
                          ticks: {
                            color: "#aaa",
                            maxRotation: 45,
                            minRotation: 45
                          },
                          grid: {
                            color: "rgba(255, 255, 255, 0.1)"
                          }
                        },
                        y: {
                          ticks: {
                            color: "#aaa",
                            callback: function(value) {
                              return '₹' + value;
                            }
                          },
                          grid: {
                            color: "rgba(255, 255, 255, 0.1)"
                          }
                        },
                      },
                    }}
                  />
                </div>
              </div>
            )}

            {activeSection === "withdrawals" && (
              <div className="admin-section">
                <h3>Withdrawal Requests Management</h3>
                {requests.length === 0 ? (
                  <p style={{ textAlign: "center", padding: "20px" }}>
                    No withdrawal requests
                  </p>
                ) : (
                  <div className="withdrawal-list">
                    {requests.map((req) => {
                      const isExpanded = expandedWithdrawalId === req._id;
                      const isBankDetailsExpanded = expandedBankDetailsId === req._id;
                      const requestUserId =
                        typeof req.userId === "object" ? req.userId?._id : req.userId;
                      const userFromManagement = users.find((u) => u._id === requestUserId);
                      const bankDetails = getEffectiveBankDetails(
                        req,
                        userFromManagement?.bankDetails
                      );
                      return (
                        <div key={req._id} className={`withdrawal-card ${isExpanded ? 'expanded' : 'collapsed'}`}>
                          <div
                            className="withdrawal-header"
                            style={{ cursor: "pointer" }}
                            onClick={() => {
                              setExpandedWithdrawalId(isExpanded ? null : req._id);
                              if (isExpanded) {
                                setExpandedBankDetailsId(null);
                              }
                            }}
                          >
                            <div className="withdrawal-header-summary">
                              <strong>{req.userId?.name || "Unknown"}</strong>
                              <span className="withdrawal-amount-badge">₹ {Number(req.amount || 0).toFixed(2)}</span>
                              <span className={`status-badge ${req.status}`}>
                                {req.status.toUpperCase()}
                              </span>
                            </div>
                            <span className="expand-icon">{isExpanded ? "▼" : "▶"}</span>
                          </div>

                          {isExpanded && (
                            <div className="withdrawal-details">
                              <div className="withdrawal-info">
                                <div>
                                  <p><strong>User Email:</strong> {req.userId?.email || "N/A"}</p>
                                  <p><strong>User ID:</strong> {req.userId?.uniqueId || "N/A"}</p>
                                  <p><strong>Amount:</strong> ₹ {Number(req.amount || 0).toFixed(2)}</p>
                                  {(req.type === "coin" || !req.type) && (
                                    <p><strong>Coins:</strong> {Number(req.coinAmount || 0).toFixed(2)}</p>
                                  )}
                                  {req.type === "bonus" && (
                                    <p><strong>Type:</strong> Bonus Withdrawal</p>
                                  )}
                                  <p><strong>Date:</strong> {new Date(req.createdAt).toLocaleString()}</p>
                                </div>
                              </div>

                              {hasBankDetails(bankDetails) && (
                                <div className="withdrawal-bank-panel">
                                  <button
                                    type="button"
                                    className="bank-details-toggle-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedBankDetailsId(
                                        isBankDetailsExpanded ? null : req._id
                                      );
                                    }}
                                  >
                                    {isBankDetailsExpanded ? "Hide Bank Details" : "View Bank Details"}
                                  </button>

                                  {isBankDetailsExpanded && (
                                    <div className="withdrawal-bank-details">
                                      <h4>Bank Details</h4>
                                      <div className="bank-details-grid">
                                        {bankDetails.accountHolderName && (
                                          <div className="bank-detail-item">
                                            <span className="bank-label">Account Holder</span>
                                            <span className="bank-value">{bankDetails.accountHolderName}</span>
                                          </div>
                                        )}
                                        {bankDetails.bankName && (
                                          <div className="bank-detail-item">
                                            <span className="bank-label">Bank Name</span>
                                            <span className="bank-value">{bankDetails.bankName}</span>
                                          </div>
                                        )}
                                        {bankDetails.accountNumber && (
                                          <div className="bank-detail-item">
                                            <span className="bank-label">Account Number</span>
                                            <span className="bank-value account-number">{bankDetails.accountNumber}</span>
                                          </div>
                                        )}
                                        {bankDetails.ifscCode && (
                                          <div className="bank-detail-item">
                                            <span className="bank-label">IFSC Code</span>
                                            <span className="bank-value">{bankDetails.ifscCode}</span>
                                          </div>
                                        )}
                                        {bankDetails.branch && (
                                          <div className="bank-detail-item">
                                            <span className="bank-label">Branch</span>
                                            <span className="bank-value">{bankDetails.branch}</span>
                                          </div>
                                        )}
                                        {bankDetails.upiId && (
                                          <div className="bank-detail-item">
                                            <span className="bank-label">UPI ID</span>
                                            <span className="bank-value">{bankDetails.upiId}</span>
                                          </div>
                                        )}
                                        {bankDetails.qrImage && (
                                          <div className="bank-detail-item qr-item">
                                            <span className="bank-label">QR Code</span>
                                            <img
                                              src={bankDetails.qrImage}
                                              alt="UPI QR"
                                              className="bank-qr-img"
                                            />
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {req.status === "pending" && (
                                <div className="withdrawal-actions">
                                  <button
                                    className="approve-btn"
                                    onClick={() => approve(req._id)}
                                    disabled={processing === req._id}
                                  >
                                    {processing === req._id ? "Processing..." : "✓ Approve"}
                                  </button>

                                  <button
                                    className="reject-btn"
                                    onClick={() => reject(req._id)}
                                    disabled={processing === req._id}
                                  >
                                    {processing === req._id ? "Processing..." : "✕ Reject"}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeSection === "users" && (
              <div className="admin-section">
                <div className="user-management-header">
                  <h3>User Management</h3>
                  <div className="user-filters">
                    <button
                      className={`filter-btn ${userStatus === "all" ? "active" : ""}`}
                      onClick={() => {
                        setUserStatus("all");
                        fetchUsers({ status: "all" });
                      }}
                    >
                      All Users
                    </button>
                    <button
                      className={`filter-btn ${userStatus === "active" ? "active" : ""}`}
                      onClick={() => {
                        setUserStatus("active");
                        fetchUsers({ status: "active" });
                      }}
                    >
                      Active Users
                    </button>
                    <button
                      className={`filter-btn ${userStatus === "inactive" ? "active" : ""}`}
                      onClick={() => {
                        setUserStatus("inactive");
                        fetchUsers({ status: "inactive" });
                      }}
                    >
                      Inactive Users
                    </button>
                  </div>
                  <div className="user-search">
                    <input
                      type="text"
                      placeholder="Search by name or email"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                    />
                    <button className="search-btn" onClick={() => fetchUsers()}>
                      Search
                    </button>
                  </div>
                </div>

                {usersLoading ? (
                  <LoadingSpinner message="Loading users..." />
                ) : users.length === 0 ? (
                  <p style={{ textAlign: "center", padding: "20px" }}>
                    No users found
                  </p>
                ) : (
                  <div className="user-list">
                    {users.map((item) => {
                      const isExpanded = expandedUserId === item._id;
                      return (
                        <div key={item._id} className={`user-card ${isExpanded ? 'expanded' : 'collapsed'}`}>
                          <div
                            className="user-header"
                            style={{ cursor: "pointer" }}
                            onClick={() => setExpandedUserId(isExpanded ? null : item._id)}
                          >
                            <div className="user-header-summary">
                              <strong>{item.name || "Unnamed"}</strong>
                              <span className="user-email-badge">{item.email || "N/A"}</span>
                              <span className={`user-status-badge ${item.isActivated ? 'active' : 'inactive'}`}>
                                {item.isActivated ? "Active" : "Inactive"}
                              </span>
                            </div>
                            <span className="expand-icon">{isExpanded ? "▼" : "▶"}</span>
                          </div>

                          {isExpanded && (
                            <div className="user-details">
                              <div className="user-info">
                                <div>
                                  <p><strong>ID:</strong> {item.uniqueId || "-"}</p>
                                  <p><strong>Email:</strong> {item.email || "N/A"}</p>
                                  <p><strong>Role:</strong> {item.role || "user"}</p>
                                  <p><strong>Status:</strong> {item.isActivated ? "Active" : "Inactive"}</p>
                                </div>
                                <div className="user-balances">
                                  <p>
                                    <strong>Bonus Wallet:</strong> ₹ {item.bonusWallet?.toFixed?.(2) || 0}
                                  </p>
                                  <p>
                                    <strong>Coins:</strong> {item.coins?.toFixed?.(2) || 0}
                                  </p>
                                </div>
                              </div>

                              {item.bankDetails && (
                                <div className="user-bank-details">
                                  <p><strong>Account Holder:</strong> {item.bankDetails.accountHolderName || "-"}</p>
                                  <p><strong>Bank Name:</strong> {item.bankDetails.bankName || "-"}</p>
                                  <p><strong>Account Number:</strong> {item.bankDetails.accountNumber || "-"}</p>
                                  <p><strong>Branch:</strong> {item.bankDetails.branch || "-"}</p>
                                  <p><strong>IFSC Code:</strong> {item.bankDetails.ifscCode || "-"}</p>
                                  <p><strong>UPI ID:</strong> {item.bankDetails.upiId || "-"}</p>
                                  {item.bankDetails.qrImage && (
                                    <img
                                      className="user-bank-qr"
                                      src={item.bankDetails.qrImage}
                                      alt="UPI QR"
                                    />
                                  )}
                                </div>
                              )}

                              <div className="user-actions">
                                <div className="user-action-block">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="New bonus wallet balance"
                                    autoComplete="off"
                                    name={`bonus-wallet-${item._id}`}
                                    inputMode="decimal"
                                    value={walletEdits[item._id] ?? ""}
                                    onChange={(e) =>
                                      handleWalletChange(item._id, e.target.value)
                                    }
                                  />
                                  <button
                                    className="primary-btn"
                                    onClick={() => updateWallet(item._id)}
                                    disabled={userActionLoading === item._id}
                                  >
                                    {userActionLoading === item._id
                                      ? "Updating..."
                                      : "Update Bonus Wallet"}
                                  </button>
                                </div>

                                <div className="user-action-block">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="New coin wallet balance"
                                    autoComplete="off"
                                    name={`coin-wallet-${item._id}`}
                                    inputMode="decimal"
                                    value={coinEdits[item._id] ?? ""}
                                    onChange={(e) =>
                                      handleCoinChange(item._id, e.target.value)
                                    }
                                  />
                                  <button
                                    className="primary-btn"
                                    onClick={() => updateCoinWallet(item._id)}
                                    disabled={userActionLoading === item._id}
                                  >
                                    {userActionLoading === item._id
                                      ? "Updating..."
                                      : "Update Coin Wallet"}
                                  </button>
                                </div>

                                <div className="user-action-block">
                                  <input
                                    type="password"
                                    placeholder="New password"
                                    autoComplete="new-password"
                                    name={`admin-reset-password-${item._id}`}
                                    value={passwordEdits[item._id] ?? ""}
                                    onChange={(e) =>
                                      handlePasswordChange(item._id, e.target.value)
                                    }
                                  />
                                  <button
                                    className="secondary-btn"
                                    onClick={() => updatePassword(item._id)}
                                    disabled={userActionLoading === item._id}
                                  >
                                    {userActionLoading === item._id
                                      ? "Updating..."
                                      : "Change Password"}
                                  </button>
                                </div>

                                <div className="user-action-block">
                                  <button
                                    className="danger-btn"
                                    onClick={() => deleteUser(item._id)}
                                    disabled={userActionLoading === item._id}
                                  >
                                    {userActionLoading === item._id
                                      ? "Deleting..."
                                      : "Delete User"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeSection === "genealogy" && (
              <div className="admin-section">
                <AdminGenealogy />
              </div>
            )}

            {activeSection === "settings" && (
              <div className="admin-section">
                <h3>System Settings</h3>
                <div className="settings-card">
                  <div>
                    <p className="settings-label">Coin Price (₹ per coin)</p>
                    <p className="settings-value">
                      Current: ₹ {coinPrice ?? "-"}
                    </p>
                  </div>
                  <div className="settings-actions">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Enter new coin price"
                      value={coinPriceInput}
                      onChange={(e) => setCoinPriceInput(e.target.value)}
                    />
                    <button
                      className="primary-btn"
                      onClick={updateCoinPrice}
                      disabled={coinPriceLoading}
                    >
                      {coinPriceLoading ? "Updating..." : "Update Price"}
                    </button>
                  </div>
                </div>

                <div className="settings-card">
                  <div>
                    <p className="settings-label">Activation Fee (INR)</p>
                    <p className="settings-value">
                      Current: ₹{activationFee ?? "-"}
                    </p>
                  </div>
                  <div className="settings-actions">
                    <input
                      type="number"
                      step="1"
                      min="1"
                      placeholder="Enter activation fee"
                      value={activationFeeInput}
                      onChange={(e) => setActivationFeeInput(e.target.value)}
                    />
                    <button
                      className="primary-btn"
                      onClick={updateActivationFee}
                      disabled={activationFeeLoading}
                    >
                      {activationFeeLoading ? "Updating..." : "Update Fee"}
                    </button>
                  </div>
                </div>

                <div className="settings-card">
                  <div>
                    <p className="settings-label">Chart Y-Axis Range (₹)</p>
                    <p className="settings-value">
                      Current: ₹{minYAxis ?? "-"} to ₹{maxYAxis ?? "-"}
                    </p>
                  </div>
                  <div className="settings-actions">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Min (₹)"
                      value={minYAxisInput}
                      onChange={(e) => setMinYAxisInput(e.target.value)}
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Max (₹)"
                      value={maxYAxisInput}
                      onChange={(e) => setMaxYAxisInput(e.target.value)}
                    />
                    <button
                      className="primary-btn"
                      onClick={updateYAxisRange}
                      disabled={yAxisRangeLoading}
                    >
                      {yAxisRangeLoading ? "Updating..." : "Update Range"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

function StatCard({ title, value, highlight }) {
  return (
    <div className={`stat-card ${highlight ? "highlight-card" : ""}`}>
      <h4>{title}</h4>
      <h2>{value}</h2>
    </div>
  );
}

export default AdminDashboard;
