import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../api/api";

const SignUp = ({ onSignUp }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // NEW STATE for hover effect
  const [isFileInputHover, setIsFileInputHover] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleFileChange = (e) => setAvatar(e.target.files[0]);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("email", form.email);
      formData.append("password", form.password);
      if (avatar) formData.append("avatar", avatar);

      const res = await api.post("/api/auth/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      localStorage.setItem("token", res.data.token);
      onSignUp?.();
      navigate("/home");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // --- Responsive Styling Logic ---
  const getResponsiveStyle = (desktop, mobile) => (isMobile ? mobile : desktop);
  const cardStyle = { ...styles.card, flexDirection: getResponsiveStyle("row", "column"), width: getResponsiveStyle("950px", "90%"), height: getResponsiveStyle("550px", "auto"), maxHeight: "90vh", overflowY: isMobile ? "auto" : "hidden" };
  const leftSectionStyle = { ...styles.leftSection, display: getResponsiveStyle("flex", "none") };
  const rightSectionStyle = { ...styles.rightSection, flex: getResponsiveStyle(1, "unset"), padding: getResponsiveStyle("40px", "30px 20px") };
  const formStyle = { ...styles.form, width: getResponsiveStyle("90%", "100%") };

  // Conditional Style for the File Input Container
  const fileInputContainerStyle = {
    ...styles.fileInputContainer,
    // Apply different styles if hovering
    ...(isFileInputHover && styles.fileInputContainerHover),
  };


  return (
    <div style={styles.container}>
      <div style={cardStyle}>
        {/* Aesthetic Left Section (Hidden on Mobile) */}
        <div style={leftSectionStyle}>
          <h1 style={styles.brand}>Join the Adventure!</h1>
          <p style={styles.tagline}>
            Unlock your potential and start creating amazing things. ✨
            <br />
            Sign up now and experience the full platform!
          </p>
          <div style={styles.illustrationPlaceholder}>
            <svg style={styles.svgIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM16 16.94l-4-2.81-4 2.81V7.06h8v9.88z"/>
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M16 16.94l-4-2.81-4 2.81V7.06h8z"></path>
            </svg>
          </div>
        </div>

        {/* Form Right Section */}
        <div style={rightSectionStyle}>
          <form onSubmit={handleSignUp} style={formStyle}>
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
            
            {/* --- REVISED Custom File Input with Hover Effect --- */}
            <div 
              style={fileInputContainerStyle}
              onMouseEnter={() => setIsFileInputHover(true)}
              onMouseLeave={() => setIsFileInputHover(false)}
            >
                {/* Icon for Upload/Camera */}
                <svg style={{...styles.uploadIcon, ...(isFileInputHover && styles.uploadIconHover)}} viewBox="0 0 24 24" fill="none" stroke="#6a82fb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                <label htmlFor="avatar-upload" style={styles.fileInputLabel}>
                    {avatar 
                        ? `${avatar.name} (Ready to upload)` : "Upload Profile Photo (Optional)"
                    }
                </label>
                <input
                    id="avatar-upload"
                    type="file"
                    name="avatar"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={styles.hiddenInput}
                />
            </div>

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
    position: "relative",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    overflow: "hidden",
    fontFamily: "'Inter', sans-serif",
    padding: "20px",
    background: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
    animation: "gradientShift 10s ease infinite",
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
    display: "flex", 
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  },
  brand: { 
    fontSize: "38px", 
    marginBottom: "15px", 
    fontWeight: "800", 
    letterSpacing: "1.5px",
    textShadow: "0 4px 6px rgba(0,0,0,0.15)",
  },
  tagline: { 
    fontSize: "17px", 
    opacity: "0.9", 
    marginBottom: "50px",
    lineHeight: "1.6",
    fontWeight: "300",
  },
  illustrationPlaceholder: {
    width: "150px",
    height: "150px",
    marginTop: "20px",
    borderRadius: "50%",
    backgroundColor: "rgba(255, 255, 255, 0.1)", 
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 0 20px rgba(255, 255, 255, 0.3)",
  },
  svgIcon: {
    width: "80%",
    height: "80%",
    color: "white", 
    strokeWidth: "1",
  },
  rightSection: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px",
    backgroundColor: "#ffffff",
  },
  form: {
    width: "100%",
    maxWidth: "360px", 
    display: "flex",
    flexDirection: "column",
    gap: "18px", 
  },
  title: {
    textAlign: "center",
    fontSize: "30px", 
    color: "#333333", 
    marginBottom: "25px",
    fontWeight: "700",
  },
  input: {
    padding: "16px",
    borderRadius: "12px", 
    border: "1px solid #d0d7de", 
    outline: "none",
    fontSize: "16px",
    backgroundColor: "#f9fbfd", 
    transition: "border-color 0.3s ease, box-shadow 0.3s ease",
  },
  // --- Custom File Input Styles (Revised with Hover) ---
  fileInputContainer: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px',
    borderRadius: '12px',
    border: '1px solid #d0d7de',
    backgroundColor: '#f9fbfd',
    cursor: 'pointer',
    transition: 'border-color 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease',
  },
  // NEW Hover Style
  fileInputContainerHover: {
    borderColor: '#6a82fb', // Change border color to primary accent
    backgroundColor: '#eef4ff', // Light blue background glow
    boxShadow: '0 0 0 2px rgba(106, 130, 251, 0.3)', // Subtle glow effect
  },
  uploadIcon: {
    width: '20px',
    height: '20px',
    marginRight: '12px',
    verticalAlign: 'middle',
    transition: 'stroke 0.3s ease',
  },
  
  uploadIconHover: {
      stroke: '#fc5c7d', // Change icon color on hover to the secondary accent
  },
  fileInputLabel: {
    flexGrow: 1,
    fontSize: '16px',
    color: '#6c757d',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontWeight: '500',
  },
  hiddenInput: {
    display: 'none',
  },

  button: {
    padding: "16px",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(135deg, #6a82fb 0%, #fc5c7d 100%)",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "17px",
    letterSpacing: "0.5px",
    transition: "all 0.3s ease",
    boxShadow: "0 10px 25px rgba(106, 130, 251, 0.4)", 
  },
  error: {
    color: "#e74c3c",
    textAlign: "center",
    fontSize: "14px",
    fontWeight: "500",
    marginTop: "-5px",
  },
  text: {
    textAlign: "center",
    fontSize: "15px",
    color: "#6c757d", 
  },
  link: {
    color: "#6a82fb",
    fontWeight: "600",
    textDecoration: "none",
    transition: "color 0.3s ease",
  },
};

export default SignUp;