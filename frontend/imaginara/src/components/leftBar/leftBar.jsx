import React from "react";
import { Link, useLocation } from "react-router-dom";

const LeftBar = () => {
  const location = useLocation(); // Get current path

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
      borderRight: "1px solid #e9e9e9",
      backgroundColor: "#fff",
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
    },
    active: {
      backgroundColor: "#e0e0e0", // Highlight color
      transform: "scale(1.1)",
    },
    logo: {
      width: "32px",
      height: "32px",
    },
  };

  const menuItems = [
    { path: "/", icon: "https://cdn-icons-png.flaticon.com/512/1946/1946436.png", alt: "Home" },
    { path: "/create", icon: "https://cdn-icons-png.flaticon.com/512/1828/1828817.png", alt: "Create" },
    { path: "/updates", icon: "https://cdn-icons-png.flaticon.com/512/1828/1828899.png", alt: "Updates" },
    { path: "/messages", icon: "https://cdn-icons-png.flaticon.com/512/2462/2462719.png", alt: "Messages" },
    { path: "/settings", icon: "https://cdn-icons-png.flaticon.com/512/3524/3524659.png", alt: "Settings" },
  ];

  return (
    <div style={styles.leftBar}>
      <div style={styles.menuIcons}>
        {/* Logo */}
        <Link
          to="/"
          style={{
            ...styles.menuIcon,
            ...(location.pathname === "/" ? styles.active : {}),
          }}
        >
          <img
            src="https://cdn-icons-png.flaticon.com/512/888/888879.png"
            alt="Logo"
            style={styles.logo}
          />
        </Link>

        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            style={{
              ...styles.menuIcon,
              ...(location.pathname === item.path ? styles.active : {}),
            }}
          >
            <img src={item.icon} alt={item.alt} width={24} height={24} />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default LeftBar;
