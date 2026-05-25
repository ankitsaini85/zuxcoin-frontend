import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../api";
import SEOHelmet from "../components/SEOHelmet";
import Navbar from "../components/Navbar";
import LoadingSpinner from "../components/LoadingSpinner";

function Withdrawal() {
  const [data, setData] = useState(null);
  const [coinAmount, setCoinAmount] = useState("");
  const [bonusAmount, setBonusAmount] = useState("");
  const [popup, setPopup] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("coin");
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const bankDetails = user?.bankDetails || {};

  const hasBankDetails = Boolean(
    bankDetails.accountHolderName ||
      bankDetails.bankName ||
      bankDetails.accountNumber ||
      bankDetails.branch ||
      bankDetails.ifscCode
  );

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await API.get("/withdrawal/info");
      setData(res.data);
    } catch (err) {
      console.error("Error fetching withdrawal data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUser = async () => {
    try {
      const res = await API.get("/user/profile");
      setUser(res.data);
      
      // Redirect inactive users to payment page
      if (!res.data.isActivated) {
        navigate("/get-card");
      }
    } catch (err) {
      console.error("Error fetching user:", err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchUser();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = (params.get("tab") || "coin").toLowerCase();
    setActiveTab(tab === "bonus" ? "bonus" : "coin");
  }, [location.search]);


  const showPopup = (type, title, message, details = null) => {
    setPopup({ type, title, message, details });
  };

  const closePopup = () => {
    if (requestSubmitting) return;
    setPopup(null);
  };

  const showMissingBankDetailsPopup = () => {
    showPopup(
      "warning",
      "Add Bank Details First",
      "Please add your bank details before creating a withdrawal request.",
      null
    );
    setPopup((prev) => ({
      ...prev,
      mode: "missing-bank",
    }));
  };

  const openConfirmRequestPopup = ({ title, message, details, requestType, payload }) => {
    setPopup({
      type: "info",
      title,
      message,
      details,
      mode: "confirm-request",
      requestType,
      payload,
      requestUpiId: bankDetails.upiId || "",
    });
  };

  const submitCoinRequest = async (amount, requestUpiId = "") => {
    const res = await API.post("/withdrawal/request", {
      coinAmount: amount,
      requestUpiId: String(requestUpiId || "").trim(),
    });
    const rupeeValue = amount * (data.coinPrice || 0);
    const taxRate = Number.isFinite(data.taxRate) ? data.taxRate : 0.05;
    const taxAmount = rupeeValue * taxRate;
    const netAmount = rupeeValue - taxAmount;

    showPopup(
      "success",
      "Request Submitted!",
      "Your withdrawal request has been submitted successfully. It will be processed by admin soon.",
      {
        Coins: `${amount.toFixed(2)} Coins`,
        "Total Amount": `₹${rupeeValue.toFixed(2)}`,
        "Tax (5%)": `₹${taxAmount.toFixed(2)}`,
        "Net Payable": `₹${netAmount.toFixed(2)}`,
        "Payout UPI": String(requestUpiId || bankDetails.upiId || "-") || "-",
        "Remaining Today": `${res.data.remainingToday || 0} Coins`,
      }
    );

    setCoinAmount("");
    fetchData();
  };

  const submitBonusRequest = async (amount, requestUpiId = "") => {
    const res = await API.post("/withdrawal/bonus-request", {
      amount,
      requestUpiId: String(requestUpiId || "").trim(),
    });
    const taxRate = Number.isFinite(data.taxRate) ? data.taxRate : 0.05;
    const taxAmount = amount * taxRate;
    const netAmount = amount - taxAmount;

    showPopup(
      "success",
      "Request Submitted!",
      "Your bonus withdrawal request has been submitted successfully. It will be processed by admin soon.",
      {
        "Total Amount": `₹${amount.toFixed(2)}`,
        "Tax (5%)": `₹${taxAmount.toFixed(2)}`,
        "Net Payable": `₹${netAmount.toFixed(2)}`,
        "Payout UPI": String(requestUpiId || bankDetails.upiId || "-") || "-",
        Request: res.data.request?._id || "-",
      }
    );

    setBonusAmount("");
    fetchData();
  };

  const handleConfirmRequest = async () => {
    if (!popup || popup.mode !== "confirm-request") return;

    const upiValue = String(popup.requestUpiId || "").trim();
    if (!upiValue) {
      showPopup(
        "error",
        "UPI Required",
        "Please add a UPI ID for this withdrawal request."
      );
      return;
    }

    setRequestSubmitting(true);
    try {
      if (popup.requestType === "coin") {
        await submitCoinRequest(Number(popup.payload.amount), upiValue);
      } else {
        await submitBonusRequest(Number(popup.payload.amount), upiValue);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to submit withdrawal request";
      showPopup("error", "Request Failed", errorMessage);
    } finally {
      setRequestSubmitting(false);
    }
  };

  const handleCoinSubmit = async () => {
    // Validation
    if (!coinAmount || coinAmount <= 0) {
      showPopup("error", "Invalid Amount", "Please enter a valid coin amount greater than 0");
      return;
    }

    const amount = Number(coinAmount);

    // Check if amount exceeds remaining daily limit
    if (amount > data.remaining) {
      showPopup(
        "warning",
        "Daily Limit Exceeded",
        `You can only withdraw ${data.remaining.toFixed(2)} coins today (10% daily limit)`,
        {
          "Requested Coins": `${amount.toFixed(2)} Coins`,
          "Available Today": `${data.remaining.toFixed(2)} Coins`,
          "Daily Limit": `${data.dailyLimit.toFixed(2)} Coins`
        }
      );
      return;
    }

    if (amount > data.coins) {
      showPopup(
        "error",
        "Insufficient Balance",
        "You don't have enough coins available",
        {
          "Requested Coins": `${amount.toFixed(2)} Coins`,
          "Available Coins": `${data.coins.toFixed(2)} Coins`
        }
      );
      return;
    }

    if (!hasBankDetails) {
      showMissingBankDetailsPopup();
      return;
    }

    try {
      const rupeeValue = amount * (data.coinPrice || 0);
      const taxRate = Number.isFinite(data.taxRate) ? data.taxRate : 0.05;
      const taxAmount = rupeeValue * taxRate;
      const netAmount = rupeeValue - taxAmount;

      openConfirmRequestPopup({
        title: "Confirm Coin Withdrawal",
        message: "Please verify your payout details before submitting this request.",
        requestType: "coin",
        payload: { amount },
        details: {
          Coins: `${amount.toFixed(2)} Coins`,
          "Total Amount": `₹${rupeeValue.toFixed(2)}`,
          "Tax (5%)": `₹${taxAmount.toFixed(2)}`,
          "Net Payable": `₹${netAmount.toFixed(2)}`,
        },
      });
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to prepare withdrawal request";
      showPopup("error", "Request Failed", errorMessage);
    }
  };

  const handleBonusSubmit = async () => {
    if (!bonusAmount || bonusAmount <= 0) {
      showPopup("error", "Invalid Amount", "Please enter a valid bonus amount greater than 0");
      return;
    }

    if (!hasBankDetails) {
      showMissingBankDetailsPopup();
      return;
    }

    const amount = Number(bonusAmount);
    if (amount > data.bonusWallet) {
      showPopup(
        "error",
        "Insufficient Bonus Balance",
        "You don't have enough bonus balance",
        {
          "Requested Amount": `₹${amount.toFixed(2)}`,
          "Bonus Balance": `₹${data.bonusWallet.toFixed(2)}`,
        }
      );
      return;
    }

    try {
      const taxRate = Number.isFinite(data.taxRate) ? data.taxRate : 0.05;
      const taxAmount = amount * taxRate;
      const netAmount = amount - taxAmount;

      openConfirmRequestPopup({
        title: "Confirm Bonus Withdrawal",
        message: "Please verify your payout details before submitting this request.",
        requestType: "bonus",
        payload: { amount },
        details: {
          "Total Amount": `₹${amount.toFixed(2)}`,
          "Tax (5%)": `₹${taxAmount.toFixed(2)}`,
          "Net Payable": `₹${netAmount.toFixed(2)}`,
        },
      });
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to prepare bonus withdrawal request";
      showPopup("error", "Request Failed", errorMessage);
    }
  };

  if (loading || !data) {
    return (
      <>
        <Navbar user={user} />
        <LoadingSpinner fullScreen message="Loading withdrawal information..." />
      </>
    );
  }

  return (
    <>
      <SEOHelmet 
        title="Withdraw Coins & Bonus - ZUX Coin | Secure Withdrawal Platform"
        description="Withdraw your ZUX Coins and bonus wallet balance instantly. 10% daily withdrawal limit. Secure and fast withdrawal process."
        keywords="withdrawal, withdraw coins, withdraw bonus, crypto withdrawal, ZUX Coin withdrawal"
        url="https://zuxcoin.in/withdrawal"
      />
      <Navbar user={user} />

      <div className="withdraw-container">

        {activeTab === "coin" && (
          <>
            {/* SUMMARY */}
            <div className="withdraw-summary">
              <h2>Daily 10% Coin Withdrawal</h2>

              <div className="summary-grid">
                <div>
                  <p>Total Coins</p>
                  <h3>{data.coins.toFixed(2)}</h3>
                </div>

                <div>
                  <p>Daily Limit (10%)</p>
                  <h3>{data.dailyLimit.toFixed(2)} Coins</h3>
                </div>

                <div>
                  <p>Remaining Today</p>
                  <h3 className="highlight">
                    {data.remaining.toFixed(2)} Coins
                  </h3>
                </div>
                <div>
                  <p>Current Coin Price</p>
                  <h3>₹ {Number(data.coinPrice || 0).toFixed(2)}</h3>
                </div>
              </div>
            </div>

            {/* REQUEST */}
            <div className="withdraw-box">
              <input
                type="number"
                placeholder="Enter coin amount"
                value={coinAmount}
                onChange={(e) => setCoinAmount(e.target.value)}
              />

              <button onClick={handleCoinSubmit}>
                Review & Confirm Coin Withdrawal
              </button>
            </div>
          </>
        )}

        {activeTab === "bonus" && (
          <>
            {/* BONUS WITHDRAWAL */}
            <div className="withdraw-summary">
              <h2>Bonus Withdrawal</h2>

              <div className="summary-grid">
                <div>
                  <p>Bonus Wallet</p>
                  <h3>₹ {data.bonusWallet.toFixed(2)}</h3>
                </div>
                <div>
                  <p>No Daily Limit</p>
                  <h3>Unlimited</h3>
                </div>
              </div>
            </div>

            <div className="withdraw-box">
              <input
                type="number"
                placeholder="Enter bonus amount"
                value={bonusAmount}
                onChange={(e) => setBonusAmount(e.target.value)}
              />

              <button onClick={handleBonusSubmit}>
                Review & Confirm Bonus Withdrawal
              </button>
            </div>
          </>
        )}

        {/* HISTORY */}
        <div className="withdraw-history">
          <h3>Withdrawal History</h3>

          {data.history.map((item) => (
            <div key={item._id} className="history-item">
              <div>
                <strong>
                  {item.type === "bonus"
                    ? `₹ ${Number(item.amount || 0).toFixed(2)}`
                    : `${Number(item.coinAmount || 0).toFixed(2)} Coins`}
                </strong>
                <p>
                  {item.type === "bonus"
                    ? "Bonus Withdrawal"
                    : `₹ ${Number(item.amount || 0).toFixed(2)}`}
                </p>
                <p>{new Date(item.createdAt).toLocaleDateString()}</p>
              </div>
              <span className={`status ${item.status}`}>
                {item.status}
              </span>
            </div>
          ))}
        </div>

      </div>

      {/* POPUP MODAL */}
      {popup && (
        <div className="popup-overlay" onClick={closePopup}>
          <div className={`popup-box ${popup.type}`} onClick={(e) => e.stopPropagation()}>
            <button className="popup-close" onClick={closePopup}>×</button>
            
            <div className="popup-icon">
              {popup.type === "success" && "✓"}
              {popup.type === "error" && "✕"}
              {popup.type === "warning" && "⚠"}
              {popup.type === "info" && "ℹ"}
            </div>

            <h3 className="popup-title">{popup.title}</h3>
            <p className="popup-message">{popup.message}</p>

            {popup.details && (
              <div className="popup-details">
                {Object.entries(popup.details).map(([key, value]) => (
                  <div key={key} className="popup-detail-item">
                    <span className="popup-detail-label">{key}:</span>
                    <span className="popup-detail-value highlight">{value}</span>
                  </div>
                ))}
              </div>
            )}

            {popup.mode === "confirm-request" && (
              <div className="popup-bank-preview">
                <h4>Payout Bank Details</h4>
                <div className="popup-bank-grid">
                  <div className="popup-bank-item">
                    <span>Account Holder</span>
                    <strong>{bankDetails.accountHolderName || "-"}</strong>
                  </div>
                  <div className="popup-bank-item">
                    <span>Bank Name</span>
                    <strong>{bankDetails.bankName || "-"}</strong>
                  </div>
                  <div className="popup-bank-item">
                    <span>Account Number</span>
                    <strong>{bankDetails.accountNumber || "-"}</strong>
                  </div>
                  <div className="popup-bank-item">
                    <span>IFSC Code</span>
                    <strong>{bankDetails.ifscCode || "-"}</strong>
                  </div>
                </div>

                <label className="popup-upi-label" htmlFor="requestUpiId">
                  Add another UPI (optional)
                </label>
                <input
                  id="requestUpiId"
                  className="popup-upi-input"
                  type="text"
                  placeholder="yourname@upi"
                  value={popup.requestUpiId || ""}
                  onChange={(e) =>
                    setPopup((prev) => ({
                      ...prev,
                      requestUpiId: e.target.value,
                    }))
                  }
                />
              </div>
            )}

            <div className="popup-actions">
              {popup.mode === "confirm-request" ? (
                <>
                  <button className="popup-btn secondary" onClick={closePopup} disabled={requestSubmitting}>
                    Cancel
                  </button>
                  <button className="popup-btn success" onClick={handleConfirmRequest} disabled={requestSubmitting}>
                    {requestSubmitting ? "Submitting..." : "Confirm Request"}
                  </button>
                </>
              ) : popup.mode === "missing-bank" ? (
                <>
                  <button className="popup-btn secondary" onClick={closePopup}>Later</button>
                  <button className="popup-btn primary" onClick={() => navigate("/bank-details")}>
                    Add Bank Details
                  </button>
                </>
              ) : (
                <button
                  className={`popup-btn ${popup.type === "success" ? "success" : "primary"}`}
                  onClick={closePopup}
                >
                  OK
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Withdrawal;
