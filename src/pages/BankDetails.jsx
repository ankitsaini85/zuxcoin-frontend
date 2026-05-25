import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import SEOHelmet from "../components/SEOHelmet";
import Navbar from "../components/Navbar";
import LoadingSpinner from "../components/LoadingSpinner";

function BankDetails() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [bankDetails, setBankDetails] = useState({
    accountHolderName: "",
    bankName: "",
    accountNumber: "",
    branch: "",
    ifscCode: "",
    upiId: "",
    qrImage: "",
  });
  const [bankSaving, setBankSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const res = await API.get("/user/profile");
        setUser(res.data);

        // Redirect inactive users to payment page
        if (!res.data.isActivated) {
          navigate("/get-card");
          return;
        }

        // Load existing bank details
        if (res.data.bankDetails) {
          setBankDetails((prev) => ({
            ...prev,
            ...res.data.bankDetails,
          }));
        }
      } catch (err) {
        console.error("Error fetching user:", err);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  const handleBankFieldChange = (field, value) => {
    setBankDetails((prev) => ({
      ...prev,
      [field]: value,
    }));
    setErrorMessage("");
  };

  const handleQrUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      handleBankFieldChange("qrImage", String(reader.result || ""));
    };
    reader.readAsDataURL(file);
  };

  const saveBankDetails = async (e) => {
    e.preventDefault();
    setBankSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await API.put("/user/bank-details", bankDetails);
      if (res.data?.user) {
        setUser(res.data.user);
        setSuccessMessage("✅ Bank details saved successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (error) {
      const message = error.response?.data?.message || "Failed to save bank details";
      setErrorMessage(message);
    } finally {
      setBankSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar user={user} />
        <LoadingSpinner fullScreen message="Loading..." />
      </>
    );
  }

  return (
    <>
      <SEOHelmet 
        title="Bank Details - ZUX Coin | Add Banking Information"
        description="Add or update your bank account details for secure withdrawals on ZUX Coin. Fast and safe payment processing."
        keywords="bank details, banking information, withdrawal, payment method, bank account"
        url="https://zuxcoin.in/bank-details"
      />
      <Navbar user={user} />

      <div className="bank-details-page-container">
        <div className="bank-details-page">
          <div className="bank-details-page-header">
            <button className="back-btn" onClick={() => navigate("/dashboard")}>
              ← Back to Dashboard
            </button>
            <h1>🏦 Bank Details</h1>
            <p className="bank-subtitle">Update your banking information for withdrawals</p>
          </div>

          {successMessage && <div className="success-message">{successMessage}</div>}
          {errorMessage && <div className="error-message">{errorMessage}</div>}

          <form className="bank-details-page-form" onSubmit={saveBankDetails}>
            <div className="form-section">
              <h3>Account Information</h3>
              <div className="bank-form-grid">
                <div className="form-group">
                  <label>Account Holder Name *</label>
                  <input
                    type="text"
                    placeholder="Enter full name"
                    value={bankDetails.accountHolderName}
                    onChange={(e) => handleBankFieldChange("accountHolderName", e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Bank Name *</label>
                  <input
                    type="text"
                    placeholder="e.g., HDFC Bank"
                    value={bankDetails.bankName}
                    onChange={(e) => handleBankFieldChange("bankName", e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Account Number *</label>
                  <input
                    type="text"
                    placeholder="e.g., 123456789012"
                    value={bankDetails.accountNumber}
                    onChange={(e) => handleBankFieldChange("accountNumber", e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Branch *</label>
                  <input
                    type="text"
                    placeholder="e.g., Mumbai Main"
                    value={bankDetails.branch}
                    onChange={(e) => handleBankFieldChange("branch", e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>IFSC Code *</label>
                  <input
                    type="text"
                    placeholder="e.g., HDFC0000123"
                    value={bankDetails.ifscCode}
                    onChange={(e) => handleBankFieldChange("ifscCode", e.target.value.toUpperCase())}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>UPI ID *</label>
                  <input
                    type="text"
                    placeholder="e.g., yourname@upi"
                    value={bankDetails.upiId}
                    onChange={(e) => handleBankFieldChange("upiId", e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>QR Code (Optional)</h3>
              <p className="form-help">Upload your UPI payment QR code for faster payments</p>
              
              <div className="qr-section">
                <div className="qr-upload-area">
                  <label className="qr-upload-label">
                    <div className="upload-icon">📸</div>
                    <span>Click to upload QR Code</span>
                    <small>PNG, JPG (Max 5MB)</small>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleQrUpload(e.target.files?.[0])}
                    />
                  </label>
                </div>

                {bankDetails.qrImage && (
                  <div className="qr-preview-box">
                    <img
                      className="qr-preview-image"
                      src={bankDetails.qrImage}
                      alt="QR Preview"
                    />
                    <button
                      type="button"
                      className="remove-qr-btn"
                      onClick={() => handleBankFieldChange("qrImage", "")}
                    >
                      ✕ Remove
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => navigate("/dashboard")}
                disabled={bankSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-save"
                disabled={bankSaving}
              >
                {bankSaving ? "💾 Saving..." : "💾 Save Bank Details"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default BankDetails;
