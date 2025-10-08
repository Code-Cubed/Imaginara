import React, { useState } from "react";
import api from "../../api/api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSendOtp = async () => {
    setError(""); setMessage("");
    try {
      await api.post("/api/auth/send-otp", { email });
      setOtpSent(true);
      setMessage("OTP sent to your email");
    } catch (err) {
      setError(err.response?.data?.message || "Error sending OTP");
    }
  };

  const handleResetPassword = async () => {
    setError(""); setMessage("");
    try {
      await api.post("/api/auth/reset-password", { email, otp, newPassword });
      setMessage("Password reset successfully! You can login now.");
      setOtpSent(false);
      setEmail(""); setOtp(""); setNewPassword("");
    } catch (err) {
      setError(err.response?.data?.message || "Error resetting password");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "50px auto", padding: 20, border: "1px solid #ccc", borderRadius: 10 }}>
      <h2>Forgot Password</h2>
      {!otpSent ? (
        <>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <button onClick={handleSendOtp}>Send OTP</button>
        </>
      ) : (
        <>
          <input type="text" placeholder="OTP" value={otp} onChange={e => setOtp(e.target.value)} />
          <input type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          <button onClick={handleResetPassword}>Reset Password</button>
        </>
      )}
      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default ForgotPassword;
