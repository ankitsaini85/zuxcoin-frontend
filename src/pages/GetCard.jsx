import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import SEOHelmet from "../components/SEOHelmet";
import PaymentModal from "../components/PaymentModal";
import LoadingSpinner from "../components/LoadingSpinner";
import Navbar from "../components/Navbar";
import "../styles/GetCard.css";

function GetCard() {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();

  const [cardAmount, setCardAmount] = useState(7200);

  // Handle "Get Your Card" button click - shows payment modal
  const handleGetCard = () => {
    setShowPaymentModal(true);
  };

  useEffect(() => {
    const fetchActivationFee = async () => {
      try {
        const res = await API.get("/public/activation-fee");
        const fee = Number(res.data?.activationFee);
        if (Number.isFinite(fee) && fee > 0) {
          setCardAmount(fee);
        }
      } catch (error) {
        console.error("Failed to fetch activation fee:", error);
      }
    };

    fetchActivationFee();
  }, []);

  // Handle payment confirmation from modal
  const handlePaymentConfirm = async () => {
    setProcessing(true);
    
    try {
      // Create payment order
      const response = await API.post("/payment/watchpay/create", {
        amount: cardAmount
      });

      if (response.data.ok) {
        const { payInfo, html, orderId } = response.data;

        // If we get payInfo (payment URL), open it
        if (payInfo) {
          // Open payment page in new window
          const paymentWindow = window.open(payInfo, '_blank', 'width=800,height=600');
          
          // Poll for payment status
          pollPaymentStatus(orderId, paymentWindow);
        } 
        // If we get HTML response, create a form and submit it
        else if (html) {
          // Create a temporary div to hold the HTML
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = html;
          document.body.appendChild(tempDiv);
          
          // Find and submit any form in the HTML
          const form = tempDiv.querySelector('form');
          if (form) {
            form.submit();
          }
          
          // Poll for payment status
          pollPaymentStatus(orderId, null);
        }
      } else {
        alert('Failed to create payment order');
        setProcessing(false);
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert(error.response?.data?.message || 'Payment failed. Please try again.');
      setProcessing(false);
    }
  };

  const pollPaymentStatus = (orderId, paymentWindow) => {
    let attempts = 0;
    const maxAttempts = 60; // Poll for 5 minutes (60 * 5 seconds)
    
    const interval = setInterval(async () => {
      attempts++;
      
      try {
        const statusResponse = await API.get(`/payment/watchpay/status/${orderId}`);
        
        if (statusResponse.data.status === 'PAID') {
          clearInterval(interval);
          
          // Close payment window if it exists
          if (paymentWindow && !paymentWindow.closed) {
            paymentWindow.close();
          }
          
          alert('Payment successful! Your account has been activated.');
          setShowPaymentModal(false);
          navigate('/dashboard');
        } else if (statusResponse.data.status === 'FAILED') {
          clearInterval(interval);
          
          // Close payment window if it exists
          if (paymentWindow && !paymentWindow.closed) {
            paymentWindow.close();
          }
          
          alert('Payment failed. Please try again.');
          setProcessing(false);
        }
        
        // Check if payment window was closed by user
        if (paymentWindow && paymentWindow.closed && attempts > 3) {
          // Continue polling for a bit in case payment was completed
          if (attempts > 10) {
            clearInterval(interval);
            alert('Payment window closed. If you completed the payment, please wait a moment and check your dashboard.');
            setProcessing(false);
          }
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      }
      
      // Stop polling after max attempts
      if (attempts >= maxAttempts) {
        clearInterval(interval);
        alert('Payment status check timed out. Please check your dashboard or contact support.');
        setProcessing(false);
      }
    }, 5000); // Check every 5 seconds
  };

  return (
    <>
      <SEOHelmet 
        title="Activate Account - ZUX Coin | Get Digital Coins for ₹7200"
        description="Activate your ZUX Coin account for ₹7200 and receive digital coins instantly. Start trading, earn referral bonuses, and withdraw profits."
        keywords="account activation, ZUX Coin activation, digital coins, crypto investment, account setup"
        url="https://zuxcoin.in/get-card"
      />
      <Navbar />
      {processing && <LoadingSpinner fullScreen message="Processing payment..." />}
      <div className="get-card-container">
      <div className="get-card-content">
        <h1>🛡️ Activate Your ZUX Account</h1>
        
        <div className="get-card-intro">
          <p>Get started with ZUX and unlock amazing benefits:</p>
        </div>

        <div className="get-card-benefits">
          <div className="benefit-item">
            <span className="benefit-icon">💰</span>
            <div>
              <h4>₹{cardAmount} For Coins</h4>
              <p>Get card immediately</p>
            </div>
          </div>
          <div className="benefit-item">
            <span className="benefit-icon">🎁</span>
            <div>
              <h4>Direct Referral Bonus</h4>
              <p>Get ₹2500 when you refer</p>
            </div>
          </div>
          <div className="benefit-item">
            <span className="benefit-icon">📊</span>
            <div>
              <h4>Position in Network</h4>
              <p>Unlock milestone bonuses</p>
            </div>
          </div>
          <div className="benefit-item">
            <span className="benefit-icon">🔄</span>
            <div>
              <h4>P2P Transfers</h4>
              <p>Send coins to other users</p>
            </div>
          </div>
        </div>

        <div className="get-card-pricing">
          <div className="pricing-box">
            <h3>Activation Fee</h3>
            <div className="price-display">
              <span className="currency">₹</span>
              <span className="amount">{cardAmount}</span>
            </div>
            <p className="price-note">One-time activation fee</p>
          </div>
        </div>

        <button 
          onClick={handleGetCard}
          disabled={processing}
          className="get-card-btn"
        >
          {processing ? "Processing..." : "Get Your Card Now"}
        </button>

        <div className="get-card-info">
          <p>✓ Secure payment through WatchPay</p>
          <p>✓ Instant account activation</p>
          <p>✓ Start earning immediately</p>
        </div>
      </div>

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        amount={cardAmount}
        onConfirm={handlePaymentConfirm}
        isProcessing={processing}
      />
    </div>
    </>
  );
}


export default GetCard;
