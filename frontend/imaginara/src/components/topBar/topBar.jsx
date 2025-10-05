import React from "react";
import { useNavigate } from "react-router-dom";

const Image = ({ src, alt, w = 24, h = 24 }) => (
  <img src={src} alt={alt} width={w} height={h} style={{ display: "block" }} />
);

const TopBar = () => {
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate(`/search?search=${e.target.search.value}`);
  };

  const handleUserClick = () => {
    console.log("🔵 User button clicked!");
    console.log("🔵 Current path:", window.location.pathname);
    navigate('/profile');
    console.log("🔵 Navigate called to /profile");
    setTimeout(() => {
      console.log("🔵 Path after navigate:", window.location.pathname);
    }, 100);
  };

  return (
    <div
      style={{
        margin: "16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 16px",
        borderRadius: "16px",
        backgroundColor: "#fff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          backgroundColor: "#f1f1f1",
          borderRadius: "12px",
          padding: "8px 12px",
        }}
      >
        <Image
          src="https://cdn-icons-png.flaticon.com/512/622/622669.png"
          alt="Search"
          w={20}
          h={20}
        />
        <input
          type="text"
          name="search"
          placeholder="Search"
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            backgroundColor: "transparent",
            fontSize: "16px",
          }}
        />
      </form>

      <button
        onClick={handleUserClick}
        style={{
          padding: "8px 16px",
          borderRadius: "12px",
          border: "none",
          backgroundColor: "#3b82f6",
          color: "#fff",
          cursor: "pointer",
          boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
          transition: "all 0.2s ease",
          marginLeft: "12px",
          fontWeight: "600",
        }}
      >
        User
      </button>
    </div>
  );
};

export default TopBar;