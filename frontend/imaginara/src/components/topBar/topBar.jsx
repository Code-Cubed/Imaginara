import React from "react";
import { useNavigate } from "react-router";

// Placeholder Image component
const Image = ({ src, alt, w = 24, h = 24 }) => (
  <img src={src} alt={alt} width={w} height={h} style={{ display: "block" }} />
);

// Placeholder UserButton
const UserButton = () => (
  <button
    style={{
      padding: "8px 16px",
      borderRadius: "12px",
      border: "none",
      backgroundColor: "#fff",
      cursor: "pointer",
      boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
      transition: "all 0.2s ease",
    }}
    onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)")}
    onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.2)")}
  >
    User
  </button>
);

const TopBar = () => {
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate(`/search?search=${e.target.search.value}`);
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
      {/* SEARCH */}
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

      {/* USER */}
      <UserButton />
    </div>
  );
};

export default TopBar;
