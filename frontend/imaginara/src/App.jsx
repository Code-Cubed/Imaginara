// src/App.jsx
import React, { useState, useEffect, useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Landing from "./pages/Landing/Landing";
import Login from "./pages/Auth/Login";
import SignUp from "./pages/Auth/SignUp";
import HomePage from "./pages/Artwork/ArtworkList";
import ArtworkDetail from "./pages/Artwork/ArtworkDetail";
import AddArtwork from "./pages/Artwork/AddArtwork";
import ExplorePage from "./pages/Home/ExplorePage";
import ProfilePage from "./pages/Profile/ProfilePage";
import Settings from "./pages/Settings/Settings";
import ChatAI from "./pages/Messages/ChatAi"; // ✅ AI Chat page

import ProtectedLayout from "./components/ProtectedLayout";
import { ThemeProvider, ThemeContext } from "./Context/ThemeContext";

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

function AppContent() {
  const { theme } = useContext(ThemeContext);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) setIsAuthenticated(true);
    setLoading(false);
  }, []);

  const handleLogin = () => setIsAuthenticated(true);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">Loading...</div>
    );
  }

  return (
    <div data-theme={theme} className="min-h-screen">
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/landing"
            element={isAuthenticated ? <Navigate to="/home" replace /> : <Landing />}
          />
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/home" replace /> : <Login onLogin={handleLogin} />}
          />
          <Route
            path="/signup"
            element={isAuthenticated ? <Navigate to="/home" replace /> : <SignUp onRegister={handleLogin} />}
          />

          {/* Protected Routes */}
          <Route
            path="/home"
            element={isAuthenticated ? <ProtectedLayout onLogout={handleLogout}><HomePage /></ProtectedLayout> : <Navigate to="/login" replace />}
          />
          <Route
            path="/explore"
            element={isAuthenticated ? <ProtectedLayout onLogout={handleLogout}><ExplorePage /></ProtectedLayout> : <Navigate to="/login" replace />}
          />
          <Route
            path="/profile"
            element={isAuthenticated ? <ProtectedLayout onLogout={handleLogout}><ProfilePage /></ProtectedLayout> : <Navigate to="/login" replace />}
          />
          <Route
            path="/addartwork"
            element={isAuthenticated ? <ProtectedLayout onLogout={handleLogout}><AddArtwork /></ProtectedLayout> : <Navigate to="/login" replace />}
          />
          <Route
            path="/artwork/:id"
            element={isAuthenticated ? <ProtectedLayout onLogout={handleLogout}><ArtworkDetail /></ProtectedLayout> : <Navigate to="/login" replace />}
          />
          <Route
            path="/settings"
            element={isAuthenticated ? <ProtectedLayout onLogout={handleLogout}><Settings onLogout={handleLogout} /></ProtectedLayout> : <Navigate to="/login" replace />}
          />

          {/* ✅ AI Chat Route */}
          <Route
            path="/messages"
            element={isAuthenticated ? <ProtectedLayout onLogout={handleLogout}><ChatAI /></ProtectedLayout> : <Navigate to="/login" replace />}
          />

          {/* Default & Catch-all */}
          <Route
            path="/"
            element={isAuthenticated ? <Navigate to="/home" replace /> : <Navigate to="/landing" replace />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
