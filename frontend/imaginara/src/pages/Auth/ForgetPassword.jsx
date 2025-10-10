import React, { useState } from "react";
import api from "../../api/api";
import { useNavigate, Link } from "react-router-dom";
import "./ForgetPassword.css";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ---------- SEND OTP ----------
  const handleSendOtp = async () => {
    setError("");
    setMessage("");

    // Email validation
    if (!email) {
      setError("Please enter your email");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email");
      return;
    }

    setLoading(true);

    try {
      await api.post("/api/auth/send-otp", { email });
      setOtpSent(true);
      setMessage("✅ OTP sent to your email");
    } catch (err) {
      setError(err.response?.data?.message || "Error sending OTP");
    } finally {
      setLoading(false);
    }
  };

  // ---------- RESET PASSWORD ----------
  const handleResetPassword = async () => {
    setError("");
    setMessage("");

    // Validation
    if (!otp || !newPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      await api.post("/api/auth/reset-password-otp", { email, otp, newPassword });
      setMessage("✅ Password reset successfully! Redirecting to login...");

      // Clear fields
      setTimeout(() => {
        setOtpSent(false);
        setEmail("");
        setOtp("");
        setNewPassword("");
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Error resetting password");
    } finally {
      setLoading(false);
    }
  };

  // ---------- GO BACK TO EMAIL STEP ----------
  const goBackToEmail = () => {
    setOtpSent(false);
    setOtp("");
    setNewPassword("");
    setError("");
    setMessage("");
  };

  // ---------- HANDLE ENTER KEY ----------
  const handleKeyPress = (e, callback) => {
    if (e.key === "Enter") {
      callback();
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="bg-circle circle-1"></div>
      <div className="bg-circle circle-2"></div>
      <div className="bg-circle circle-3"></div>

      <div className="forgot-password-container">
        <div className="logo-container">
          <div className="logo-icon">🔐</div>
        </div>

        <h2 className="forgot-password-title">Forgot Password?</h2>
        <p className="subtitle">
          {!otpSent
            ? "Don't worry, we'll help you reset it"
            : "Enter the code we sent to your email"}
        </p>

        <div className="step-indicator">
          <div className={`step ${true ? "active" : ""}`}></div>
          <div className={`step ${otpSent ? "active" : ""}`}></div>
        </div>

        {/* EMAIL FORM */}
        {!otpSent ? (
          <div>
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, handleSendOtp)}
                className="form-input"
                autoComplete="email"
              />
            </div>
            <button
              onClick={handleSendOtp}
              disabled={loading || !email}
              className="submit-btn"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </div>
        ) : (
          /* OTP & PASSWORD FORM */
          <div>
            <div className="form-group">
              <label className="form-label" htmlFor="otp">
                Enter OTP
              </label>
              <input
                type="text"
                id="otp"
                placeholder="6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength="6"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="newPassword">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                placeholder="Create a strong password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, handleResetPassword)}
                className="form-input"
              />
            </div>
            <button
              onClick={handleResetPassword}
              disabled={loading || !otp || !newPassword}
              className="submit-btn"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
            <div className="back-link">
              <a href="#" onClick={(e) => { e.preventDefault(); goBackToEmail(); }}>
                ← Back to email
              </a>
            </div>
          </div>
        )}

        {/* MESSAGES */}
        {message && <div className="message success">{message}</div>}
        {error && <div className="message error">{error}</div>}

        {/* BACK TO LOGIN */}
        <div className="back-link">
          <Link to="/login">← Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;