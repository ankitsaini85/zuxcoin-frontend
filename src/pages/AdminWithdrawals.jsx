import { useEffect, useState } from "react";
import API from "../api";
import Navbar from "../components/Navbar";
import LoadingSpinner from "../components/LoadingSpinner";

const getEffectiveBankDetails = (request) => {
  if (!request) return {};
  return (
    request.effectiveBankDetails ||
    request.userId?.bankDetails ||
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

function AdminWithdrawals() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await API.get("/withdrawal/all");
      const requestList = res.data?.withdrawals || res.data || [];
      setRequests(Array.isArray(requestList) ? requestList : []);
    } catch (err) {
      console.error("Error fetching requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const approve = async (id) => {
    try {
      await API.post("/withdrawal/approve", { requestId: id });
      fetchRequests();
    } catch (err) {
      console.error("Error approving request:", err);
    }
  };

  const reject = async (id) => {
    try {
      await API.post("/withdrawal/reject", { requestId: id });
      fetchRequests();
    } catch (err) {
      console.error("Error rejecting request:", err);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <LoadingSpinner fullScreen message="Loading withdrawal requests..." />
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div className="admin-container">
        <h2>Withdrawal Requests</h2>

        {requests.length === 0 && (
          <p className="admin-empty-state">No withdrawal requests found.</p>
        )}

        {requests.map((req) => {
          const bankDetails = getEffectiveBankDetails(req);
          return (
            <div key={req._id} className="admin-card">
            {/* User & Request Info */}
            <div className="admin-card-main">
              <div className="admin-user-info">
                <strong>{req.userId?.name}</strong>
                <p>{req.userId?.email}</p>
                <p className="user-id">ID: {req.userId?.uniqueId}</p>
              </div>

              <div className="admin-request-info">
                <div className="info-item">
                  <span className="label">Amount</span>
                  <span className="value">₹ {req.amount?.toFixed(2)}</span>
                </div>
                {req.taxAmount && (
                  <div className="info-item">
                    <span className="label">Tax (5%)</span>
                    <span className="value tax">₹ {req.taxAmount?.toFixed(2)}</span>
                  </div>
                )}
                {req.netAmount && (
                  <div className="info-item">
                    <span className="label">Net Amount</span>
                    <span className="value net">₹ {req.netAmount?.toFixed(2)}</span>
                  </div>
                )}
                <div className="info-item">
                  <span className="label">Type</span>
                  <span className={`type-badge ${req.type}`}>
                    {req.type === "coin" ? "Coin Withdrawal" : "Bonus Withdrawal"}
                  </span>
                </div>
                <div className="info-item">
                  <span className="label">Date</span>
                  <span className="value">{new Date(req.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Bank Details Section */}
            {hasBankDetails(bankDetails) && (
              <div className="admin-bank-details">
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
                        alt="Bank QR Code" 
                        className="bank-qr-img"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Status & Actions */}
            <div className="admin-card-footer">
              <span className={`status ${req.status}`}>
                {req.status.toUpperCase()}
              </span>

              {req.status === "pending" && (
                <div className="admin-actions">
                  <button 
                    className="approve-btn"
                    onClick={() => approve(req._id)}
                  >
                    ✓ Approve
                  </button>
                  <button
                    className="reject-btn"
                    onClick={() => reject(req._id)}
                  >
                    ✕ Reject
                  </button>
                </div>
              )}
            </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default AdminWithdrawals;
