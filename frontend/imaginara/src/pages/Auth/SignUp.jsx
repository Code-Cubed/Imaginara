 import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";   
import api from "../../api/api";

const SignUp = ({ onSignUp }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Re-creating the float animation for consistency
  useEffect(() => {
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
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/api/auth/register", form);
      localStorage.setItem("token", res.data.token);
      onSignUp?.();
      navigate("/home");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.leftSection}>
          <h1 style={styles.brand}>Join the Adventure!</h1>
          <p style={styles.tagline}>Unlock your potential and start creating amazing things. ✨</p>
         
        </div>

        <div style={styles.rightSection}>
          <form onSubmit={handleSignUp} style={styles.form}>
            <h2 style={styles.title}>Create Account</h2>
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={form.name}
              onChange={handleChange}
              required
              style={styles.input}
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
              style={styles.input}
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
              style={styles.input}
            />
            {error && <p style={styles.error}>{error}</p>}
            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? "Signing Up..." : "Sign Up"}
            </button>
            <p style={styles.text}>
              Already have an account?{" "}
              <Link to="/login" style={styles.link}>
                Login
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
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)", 
    fontFamily: "'Inter', sans-serif",
    overflow: "hidden",
  },
  card: {
    display: "flex",
    flexDirection: "row",
    width: "950px",
    height: "550px",
    borderRadius: "25px",
    overflow: "hidden",
    boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
    backgroundColor: "#ffffff",
    transition: "transform 0.3s ease-in-out",
  },
  leftSection: {
    flex: 1.2,
    background: "linear-gradient(135deg, #6a82fb 0%, #fc5c7d 100%)", 
    color: "white",
    padding: "60px 40px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  },
  brand: {
    fontSize: "42px",
    marginBottom: "15px",
    fontWeight: "700",
    letterSpacing: "1px",
    textShadow: "2px 2px 4px rgba(0,0,0,0.1)",
  },
  tagline: {
    fontSize: "18px",
    opacity: "0.95",
    marginBottom: "40px",
    lineHeight: "1.5",
  },
  image: {
    width: "280px",
    animation: "float 3s ease-in-out infinite",
    filter: "drop-shadow(5px 5px 10px rgba(0,0,0,0.2))",
  },
  rightSection: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px",
    backgroundColor: "#fefefe",
  },
  form: {
    width: "90%",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  title: {
    textAlign: "center",
    fontSize: "32px",
    color: "#333",
    marginBottom: "20px",
    fontWeight: "700",
  },
  input: {
    padding: "14px",
    borderRadius: "10px",
    border: "1px solid #e0e0e0",
    outline: "none",
    fontSize: "16px",
    transition: "border-color 0.3s ease, box-shadow 0.3s ease",
  },
  button: {
    padding: "15px",
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(135deg, #6a82fb 0%, #fc5c7d 100%)",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "17px",
    letterSpacing: "0.5px",
    transition: "all 0.3s ease",
    boxShadow: "0 8px 20px rgba(106, 130, 251, 0.3)",
    "&:hover": {
      transform: "translateY(-3px)",
      boxShadow: "0 12px 25px rgba(106, 130, 251, 0.4)",
    },
    "&:disabled": {
      opacity: "0.7",
      cursor: "not-allowed",
    },
  },
  error: {
    color: "#e74c3c",
    textAlign: "center",
    fontSize: "15px",
    marginTop: "-10px",
  },
  text: {
    textAlign: "center",
    fontSize: "15px",
    color: "#555",
  },
  link: {
    color: "#6a82fb",
    fontWeight: "600",
    textDecoration: "none",
    transition: "color 0.3s ease",
    "&:hover": {
      textDecoration: "underline",
      color: "#fc5c7d",
    },
  },
};

export default SignUp;    