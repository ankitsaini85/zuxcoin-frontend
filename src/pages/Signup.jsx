import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import API from "../api";
import SEOHelmet from "../components/SEOHelmet";
import Navbar from "../components/Navbar";
import LoadingSpinner from "../components/LoadingSpinner";

function Signup() {
  const [form, setForm] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      setForm((prev) => ({ ...prev, referralCode: ref }));
    }
  }, [searchParams]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name || !form.email || !form.password) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      await API.post("/auth/register", form);
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEOHelmet 
        title="Sign Up - ZUX Coin | Join Our Crypto Trading Platform"
        description="Create a free ZUX Coin account and start trading digital coins. Activate for ₹7200, earn referral bonuses, and withdraw profits. Join thousands of users."
        keywords="signup, register, ZUX Coin account, cryptocurrency platform, free crypto account"
        url="https://zuxcoin.in/signup"
      />
      <Navbar />
      {loading && <LoadingSpinner fullScreen message="Creating account..." />}
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join ZUX and start earning</p>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={submit} className="auth-form">
            <div className="form-group">
              <input
                type="text"
                placeholder="Full Name"
                className="auth-input"
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <input
                type="email"
                placeholder="Email Address"
                className="auth-input"
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <input
                type="password"
                placeholder="Password"
                className="auth-input"
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <input
                type="text"
                placeholder="Referral Code (Optional)"
                className="auth-input"
                value={form.referralCode || ""}
                onChange={(e) =>
                  setForm({ ...form, referralCode: e.target.value })
                }
              />
            </div>

            <button
              type="submit"
              className="auth-btn"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Sign Up"}
            </button>
          </form>

          <div className="auth-footer">
            <p>Already have an account? <Link to="/login">Login here</Link></p>
          </div>
        </div>
      </div>
    </>
  );
}

export default Signup;
