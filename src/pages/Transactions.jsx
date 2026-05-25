import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import SEOHelmet from "../components/SEOHelmet";
import Navbar from "../components/Navbar";
import LoadingSpinner from "../components/LoadingSpinner";

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await API.get("/user/transactions");
        setTransactions(res.data);
      } catch (err) {
        console.error("Error fetching transactions:", err);
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

    fetchData();
    fetchUser();
  }, []);

  if (loading) {
    return (
      <>
        <Navbar user={user} />
        <LoadingSpinner fullScreen message="Loading transactions..." />
      </>
    );
  }

  return (
    <>
      <SEOHelmet 
        title="Transaction History - ZUX Coin | Detailed Trading Records"
        description="View your complete transaction history on ZUX Coin. Track all coin transfers, withdrawals, and deposit history."
        keywords="transactions, transaction history, trading records, ZUX Coin transactions, history"
        url="https://zuxcoin.in/transactions"
      />
      <Navbar user={user} />

      <div className="transaction-container">
        <h2>Transaction History</h2>

        {transactions.length === 0 && (
          <p className="no-data">No transactions found</p>
        )}

        {transactions.map((tx) => (
          <div key={tx._id} className="transaction-card">
            <div className="tx-left">
              <h4 className={`tx-type ${tx.type}`}>
                {formatType(tx.type)}
              </h4>
              {tx.coinAmount !== null && tx.coinAmount !== undefined && (
                <p className="tx-date">
                  Coins: {Number(tx.coinAmount).toFixed(2)}
                </p>
              )}
              <p className="tx-date">
                {new Date(tx.createdAt).toLocaleString()}
              </p>
            </div>

            <div className="tx-right">
              <h3 className={tx.amount < 0 ? 'tx-negative' : 'tx-positive'}>
                {tx.amount < 0 ? '-' : '+'} ₹ {Math.abs(tx.amount).toFixed(2)}
              </h3>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function formatType(type) {
  switch (type) {
    case "activation":
      return "Activation";
    case "direct_bonus":
      return "Direct Bonus";
    case "milestone_bonus":
      return "Milestone Bonus";
    case "bonus_withdrawal":
      return "Bonus Withdrawal";
    case "coin_withdrawal":
      return "Coin Withdrawal";
    case "withdrawal":
      return "Withdrawal";
    default:
      return type;
  }
}

export default Transactions;
