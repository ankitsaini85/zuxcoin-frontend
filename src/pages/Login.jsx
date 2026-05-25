import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api";
import SEOHelmet from "../components/SEOHelmet";
import Navbar from "../components/Navbar";
import LoadingSpinner from "../components/LoadingSpinner";

function Login() {
  const [form, setForm] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!form.email || !form.password) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      const res = await API.post("/auth/login", form);
      localStorage.setItem("token", res.data.token);

      // Check if user is admin
      if (res.data.user.role === "admin") {
        navigate("/admin");
      } else {
        // Both activated and non-activated users go to dashboard
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEOHelmet 
        title="Login - ZUX Coin Account | Secure Cryptocurrency Platform"
        description="Login to your ZUX Coin account to trade digital coins, check your wallet balance, and manage your investments securely."
        keywords="login, ZUX Coin account, cryptocurrency login, secure trading"
        url="https://zuxcoin.in/login"
      />
      <Navbar />
      {loading && <LoadingSpinner fullScreen message="Logging in..." />}
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Login to your ZUX account</p>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={submit} className="auth-form">
            <div className="form-group">
              <input
                type="email"
                placeholder="Email Address"
                className="auth-input"
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div className="form-group">
              <input
                type="password"
                placeholder="Password"
                className="auth-input"
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            <button
              type="submit"
              className="auth-btn"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="auth-footer">
            <p>Don't have an account? <Link to="/signup">Sign up here</Link></p>
          </div>
        </div>
      </div>
    </>
  );
}

export default Login;
