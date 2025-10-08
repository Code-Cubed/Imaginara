import React, { useState } from "react";
import api from "../../api/api";

const ForgotPassword = () => {
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
    setLoading(true);

    try {
      await api.post("/api/auth/reset-password-otp", { email, otp, newPassword }); 
      // endpoint name changed to match backend function
      setMessage("✅ Password reset successfully! You can now login.");
      setOtpSent(false);
      setEmail("");
      setOtp("");
      setNewPassword("");
    } catch (err) {
      setError(err.response?.data?.message || "Error resetting password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: 400,
        margin: "50px auto",
        padding: 30,
        border: "1px solid #ddd",
        borderRadius: 12,
        boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
        background: "#fff",
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: 20 }}>Forgot Password</h2>

      {!otpSent ? (
        <>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "15px",
              borderRadius: "8px",
              border: "1px solid #ccc",
            }}
          />
          <button
            onClick={handleSendOtp}
            disabled={loading || !email}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "8px",
              backgroundColor: "#4f46e5",
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
          >
            {loading ? "Sending..." : "Send OTP"}
          </button>
        </>
      ) : (
        <>
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "10px",
              borderRadius: "8px",
              border: "1px solid #ccc",
            }}
          />
          <input
            type="password"
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "15px",
              borderRadius: "8px",
              border: "1px solid #ccc",
            }}
          />
          <button
            onClick={handleResetPassword}
            disabled={loading || !otp || !newPassword}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "8px",
              backgroundColor: "#4f46e5",
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </>
      )}

      {message && (
        <p style={{ color: "green", marginTop: 15, textAlign: "center" }}>
          {message}
        </p>
      )}
      {error && (
        <p style={{ color: "red", marginTop: 15, textAlign: "center" }}>
          {error}
        </p>
      )}
    </div>
  );
};

export default ForgotPassword;
