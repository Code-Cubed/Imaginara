import React, { useContext } from "react";
import { ThemeContext } from "../../Context/ThemeContext";
import { Link, useLocation } from "react-router-dom";
import { 
    Users, 
    LogOut, 
    Home, 
    PlusSquare, 
    Bot, 
    Settings, 
    Search,
    Power,
    BarChart2,
    Palette,
    Sparkles,
    Mail,
    Wand2
} from 'lucide-react'; 

const LeftBar = ({ onLogout }) => {
  const location = useLocation(); 
  const { theme } = useContext(ThemeContext);
  
  // Theme-aware colors
  const bgColor = theme === "dark" ? "#23272f" : "#fff";
  const borderColor = theme === "dark" ? "#3c424d" : "#e9e9e9";

  const styles = {
    leftBar: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "space-between",
      width: "72px",
      height: "100vh",
      position: "sticky",
      top: 0,
      padding: "16px 0px",
      borderRight: `1px solid ${borderColor}`,
      backgroundColor: bgColor,
      zIndex: 100 
    },
    menuIcons: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "24px",
    },
    menuIcon: {
      width: "48px",
      height: "48px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      borderRadius: "12px",
      transition: "all 0.3s ease",
      backgroundColor: 'transparent'
    },
    active: {
      backgroundColor: theme === 'dark' ? "#3c424d" : "#e0e0e0", 
      transform: "scale(1.1)",
    },
    lucideIcon: (isActive) => ({
        color: isActive ? (theme === 'dark' ? '#92b4f4' : '#667eea') : (theme === 'dark' ? '#b0b8c4' : '#666'),
    }),
    logout: {
      width: "48px",
      height: "48px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      borderRadius: "12px",
      backgroundColor: "#f44336",
      transition: "all 0.3s ease",
      marginTop: "16px"
    },
    logoutIconStyle: { color: '#fff' },
    logoStyle: { color: theme === 'dark' ? '#92b4f4' : '#667eea', marginBottom: '16px' },
    bottomIcons: { display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }
  };

  const menuItems = [
    { path: "/home", lucideIcon: Home, alt: "Home" },
    { path: "/addartwork", lucideIcon: PlusSquare, alt: "Add Artwork" },
    { path: "/discover", lucideIcon: Search, alt: "Discover" },
    {path:"/analytics", lucideIcon: BarChart2, alt:"Analytics"},
    {path:"/similarity-search", lucideIcon: Sparkles, alt:"Similarity Search"},
    { path: "/chatbot", lucideIcon: Bot, alt: "AI ChatBot" },
    { path: "/image-generator", lucideIcon: Wand2, alt: "AI Image Generator" },
    {path:"/boards", lucideIcon: Users, alt:"Boards"},
    { path: "/settings", lucideIcon: Settings, alt: "Settings" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token"); 
    if (onLogout) onLogout();         
  };

  return (
    <div data-theme={theme} style={styles.leftBar}>
      {/* Top Logo + Menu */}
      <div style={styles.menuIcons}>
        {/* LOGO */}
        <Link
          to="/home"
          style={{
            ...styles.menuIcon,
            ...(location.pathname === "/" || location.pathname === "/home" ? styles.active : {}),
            ...styles.logoStyle
          }}
          title="Home"
        >
          <Palette size={32} style={{ color: styles.logoStyle.color }} />
        </Link>

       

       
        {/* Mapped Menu Items */}
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const IconComponent = item.lucideIcon;
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{ ...styles.menuIcon, ...(isActive ? styles.active : {}) }}
              title={item.alt}
            >
              <IconComponent size={24} style={styles.lucideIcon(isActive)} />
            </Link>
          );
        })}
      </div>

      {/* Bottom Icons: Contact + Logout */}
      <div style={styles.bottomIcons}>
        <Link
          to="/contact"
          style={{ ...styles.menuIcon, ...(location.pathname === "/contact" ? styles.active : {}) }}
          title="Contact Us"
        >
          <Mail size={24} style={styles.lucideIcon(location.pathname === "/contact")} />
        </Link>

        <div style={styles.logout} onClick={handleLogout} title="Logout">
          <Power size={24} style={styles.logoutIconStyle} />
        </div>
      </div>
    </div>
  );
};

export default LeftBar;
