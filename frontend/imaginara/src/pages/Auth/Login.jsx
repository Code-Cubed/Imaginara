import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../api/api";
import { Eye, EyeOff } from 'lucide-react'; // Import icons

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // New state for password visibility
  const [showPassword, setShowPassword] = useState(false);

  // State to track mobile status
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Responsive logic and float animation setup
  useEffect(() => {
    // Handle Responsive Resize
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);

    // Float animation (kept for completeness)
    let styleSheet = document.styleSheets[0];
    if (!styleSheet) {
      const style = document.createElement("style");
      document.head.appendChild(style);
      styleSheet = style.sheet;
    }
    const keyframes = `
      @keyframes float {
        0% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
        100% { transform: translateY(0px); }
      }
    `;
    try {
      if (!Array.from(styleSheet.cssRules).some(rule => rule.name === 'float')) {
        styleSheet.insertRule(keyframes, styleSheet.cssRules.length);
      }
    } catch (err) {
      console.warn("Animation rule already exists or cannot be inserted:", err);
    }

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/api/auth/login", form);
      localStorage.setItem("token", res.data.token);
      onLogin?.();
      navigate("/home");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  // Responsive styling
  const getResponsiveStyle = (desktop, mobile) => (isMobile ? mobile : desktop);
  const cardStyle = { ...styles.card, flexDirection: getResponsiveStyle("row", "column"), width: getResponsiveStyle("950px", "90%"), height: getResponsiveStyle("550px", "auto"), maxHeight: "90vh", overflowY: isMobile ? "auto" : "hidden" };
  const leftSectionStyle = { ...styles.leftSection, display: getResponsiveStyle("flex", "none") };
  const rightSectionStyle = { ...styles.rightSection, flex: getResponsiveStyle(1, "unset"), padding: getResponsiveStyle("40px", "30px 20px") };
  const formStyle = { ...styles.form, width: getResponsiveStyle("90%", "100%") };

  return (
    <div style={styles.container}>
      <div style={cardStyle}>
        <div style={leftSectionStyle}>
          <h1 style={styles.brand}>Welcome Back!</h1>
          <p style={styles.tagline}>Log in and continue your creative journey 🚀</p>
        </div>

        <div style={rightSectionStyle}>
          <form onSubmit={handleLoginSubmit} style={formStyle}>
            <h2 style={styles.title}>Login</h2>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
              style={styles.input}
            />
            {/* Password input with show/hide toggle */}
            <div style={styles.passwordContainer}>
              <input
                type={showPassword ? "text" : "password"} // Dynamic type
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                required
                style={{ ...styles.input, paddingRight: '45px' }} // Add space for icon
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.passwordToggle}
              >
                {showPassword ? <EyeOff size={20} color="#777" /> : <Eye size={20} color="#777" />}
              </button>
            </div>
            
            {error && <p style={styles.error}>{error}</p>}

            {/* --- Forgot Password Link --- */}
            <p style={{ ...styles.text, marginTop: "-10px", marginBottom: "10px", textAlign: "right" }}>
              <span
                style={{ color: "#6a82fb", cursor: "pointer", textDecoration: "underline" }}
                onClick={() => navigate("/forgot-password")}
              >
                Forgot Password?
              </span>
            </p>

            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? "Logging In..." : "Login"}
            </button>

            <p style={styles.text}>
              Don’t have an account?{" "}
              <Link to="/signup" style={styles.link}>
                Sign Up
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    position: "relative",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    overflow: "hidden",
    fontFamily: "'Inter', sans-serif",
    padding: "20px",
    background: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
    // animation: "gradientShift 10s ease infinite",
  },

  
  card: {
    display: "flex",
    borderRadius: "25px",
    overflow: "hidden",
    backdropFilter: "blur(10px)",
    boxShadow: "0 15px 45px rgba(0,0,0,0.15)",
    background: "rgba(255, 255, 255, 0.85)",
    transition: "transform 0.4s ease, box-shadow 0.4s ease",
  },
  leftSection: {
    flex: 1.2,
    background: "linear-gradient(135deg, #6a82fb 0%, #fc5c7d 100%)",
    color: "white",
    padding: "60px 40px",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  },
  brand: { fontSize: "42px", marginBottom: "15px", fontWeight: "700", letterSpacing: "1px", textShadow: "2px 2px 4px rgba(0,0,0,0.1)" },
  tagline: { fontSize: "18px", opacity: "0.95", marginBottom: "40px", lineHeight: "1.5" },
  rightSection: { display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#fefefe" },
  form: { display: "flex", flexDirection: "column", gap: "20px" },
  title: { textAlign: "center", fontSize: "32px", color: "#333", marginBottom: "20px", fontWeight: "700" },
  
  // New styles for password input
  passwordContainer: {
    position: 'relative',
    width: '100%',
  },
  passwordToggle: {
    position: 'absolute',
    top: '50%',
    right: '10px',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '5px',
    lineHeight: '0',
  },
  // End new styles
  
  input: { 
    padding: "14px", 
    borderRadius: "10px", 
    border: "1px solid #e0e0e0", 
    outline: "none", 
    fontSize: "16px", 
    transition: "border-color 0.3s ease, box-shadow 0.3s ease",
    width: '100%', // Ensure input fills the container
    boxSizing: 'border-box' // Include padding in the element's total width and height
  },
  button: { padding: "15px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #6a82fb 0%, #fc5c7d 100%)", color: "#fff", cursor: "pointer", fontWeight: "700", fontSize: "17px", letterSpacing: "0.5px", transition: "all 0.3s ease", boxShadow: "0 8px 20px rgba(106, 130, 251, 0.3)" },
  error: { color: "#e74c3c", textAlign: "center", fontSize: "15px", marginTop: "-10px" },
  text: { textAlign: "center", fontSize: "15px", color: "#555" },
  link: { color: "#6a82fb", fontWeight: "600", textDecoration: "none", transition: "color 0.3s ease" },
};

export default Login;