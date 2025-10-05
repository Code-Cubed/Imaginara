import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Landing from "./pages/Landing/Landing";
import Login from "./pages/Auth/Login";
import SignUp from "./pages/Auth/SignUp";
import Home from "./pages/Home/Home";
import TopBar from "./components/topBar/TopBar";
import LeftBar from "./components/leftBar/LeftBar";

// Layout for authenticated pages with logout support
const AppLayout = ({ children, onLogout }) => (
  <div style={{ display: "flex", height: "100vh", backgroundColor: "#fafafa" }}>
    <LeftBar onLogout={onLogout} />
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <TopBar />
      <div style={{ padding: "20px", flex: 1, overflowY: "auto" }}>{children}</div>
    </div>
  </div>
);

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check for token on app start
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) setIsAuthenticated(true);
  }, []);

  // Handler for logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
  };

  return (
    <BrowserRouter>
      <Routes>
        {!isAuthenticated ? (
          // Public routes before login
          <>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login onLogin={() => setIsAuthenticated(true)} />} />
            <Route path="/signup" element={<SignUp onSignUp={() => setIsAuthenticated(true)} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </>
        ) : (
          // Authenticated routes
          <>
            <Route path="/home" element={<AppLayout onLogout={handleLogout}><Home /></AppLayout>} />
            <Route path="*" element={<Navigate to="/home" />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
};

export default App;