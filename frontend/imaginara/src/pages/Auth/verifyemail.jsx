import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../api/api";

const VerifyEmail = ({ onVerify }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  // Get email from navigation state
  const email = location.state?.email || "";

  useEffect(() => {
    if (!email) {
      navigate("/signup");
    }
  }, [email, navigate]);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`).focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length && i < 6; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const otpString = otp.join("");
    
    if (otpString.length !== 6) {
      setError("Please enter a complete 6-digit OTP");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await api.post("/api/auth/verify-email", {
        email,
        otp: otpString,
      });

      setSuccess("Email verified successfully! Redirecting...");
      
      // Save token and redirect
      localStorage.setItem("token", res.data.token);
      onVerify?.();
      
      setTimeout(() => {
        navigate("/home");
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError("");
    setSuccess("");

    try {
      await api.post("/api/auth/resend-verification-otp", { email });
      setSuccess("New OTP sent to your email!");
      setCountdown(60); // 60 second cooldown
      setOtp(["", "", "", "", "", ""]); // Clear OTP inputs
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.iconContainer}>
          <svg
            style={styles.icon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </div>

        <h2 style={styles.title}>Verify Your Email</h2>
        <p style={styles.subtitle}>
          We've sent a 6-digit verification code to
          <br />
          <strong>{email}</strong>
        </p>

        <form onSubmit={handleVerify} style={styles.form}>
          <div style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                style={styles.otpInput}
                onFocus={(e) => {
                  e.target.style.borderColor = '#6a82fb';
                  e.target.style.boxShadow = '0 0 0 3px rgba(106, 130, 251, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e0e0e0';
                  e.target.style.boxShadow = 'none';
                }}
                autoFocus={index === 0}
              />
            ))}
          </div>

          {error && <p style={styles.error}>{error}</p>}
          {success && <p style={styles.success}>{success}</p>}

          <button
            type="submit"
            disabled={loading || otp.join("").length !== 6}
            style={{
              ...styles.button,
              opacity: (loading || otp.join("").length !== 6) ? 0.7 : 1,
              cursor: (loading || otp.join("").length !== 6) ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) => {
              if (!loading && otp.join("").length === 6) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 12px 30px rgba(106, 130, 251, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 10px 25px rgba(106, 130, 251, 0.4)';
            }}
          >
            {loading ? "Verifying..." : "Verify Email"}
          </button>

          <div style={styles.resendContainer}>
            <p style={styles.resendText}>Didn't receive the code?</p>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendLoading || countdown > 0}
              style={{
                ...styles.resendButton,
                opacity: (resendLoading || countdown > 0) ? 0.5 : 1,
                cursor: (resendLoading || countdown > 0) ? 'not-allowed' : 'pointer',
              }}
            >
              {resendLoading
                ? "Sending..."
                : countdown > 0
                ? `Resend in ${countdown}s`
                : "Resend OTP"}
            </button>
          </div>
        </form>

        <button
          onClick={() => navigate("/signup")}
          style={styles.backButton}
        >
          ← Back to Sign Up
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    padding: "20px",
    background: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
    fontFamily: "'Inter', sans-serif",
  },
  card: {
    backgroundColor: "white",
    borderRadius: "25px",
    padding: "50px 40px",
    maxWidth: "500px",
    width: "100%",
    boxShadow: "0 15px 45px rgba(0,0,0,0.15)",
    textAlign: "center",
  },
  iconContainer: {
    width: "80px",
    height: "80px",
    margin: "0 auto 30px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #6a82fb 0%, #fc5c7d 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    width: "40px",
    height: "40px",
    color: "white",
  },
  title: {
    fontSize: "32px",
    fontWeight: "700",
    color: "#333",
    marginBottom: "15px",
  },
  subtitle: {
    fontSize: "16px",
    color: "#666",
    marginBottom: "40px",
    lineHeight: "1.6",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "25px",
  },
  otpContainer: {
    display: "flex",
    gap: "10px",
    justifyContent: "center",
    marginBottom: "10px",
  },
  otpInput: {
    width: "50px",
    height: "60px",
    fontSize: "24px",
    fontWeight: "600",
    textAlign: "center",
    border: "2px solid #e0e0e0",
    borderRadius: "10px",
    outline: "none",
    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
    backgroundColor: "#f9fbfd",
  },
  button: {
    padding: "16px",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(135deg, #6a82fb 0%, #fc5c7d 100%)",
    color: "white",
    fontSize: "17px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    boxShadow: "0 10px 25px rgba(106, 130, 251, 0.4)",
    opacity: 1,
  },
  error: {
    color: "#e74c3c",
    fontSize: "14px",
    fontWeight: "500",
    marginTop: "-10px",
  },
  success: {
    color: "#27ae60",
    fontSize: "14px",
    fontWeight: "500",
    marginTop: "-10px",
  },
  resendContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    alignItems: "center",
  },
  resendText: {
    fontSize: "14px",
    color: "#666",
    margin: 0,
  },
  resendButton: {
    background: "none",
    border: "none",
    color: "#6a82fb",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    textDecoration: "underline",
    padding: "5px",
    opacity: 1,
    transition: "opacity 0.2s ease",
  },
  backButton: {
    marginTop: "30px",
    background: "none",
    border: "none",
    color: "#999",
    fontSize: "14px",
    cursor: "pointer",
    padding: "10px",
  },
};

export default VerifyEmail;