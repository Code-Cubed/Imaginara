
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Landing from './pages/Landing/Landing';
import Login from './pages/Auth/Login';
import SignUp from './pages/Auth/SignUp';
import HomePage from './pages/Artwork/ArtworkList'; 
import ArtworkDetail from './pages/Artwork/ArtworkDetail';
import AddArtwork from './pages/Artwork/Addartwork';
import ExplorePage from './pages/Home/ExplorePage'; 
import ProfilePage from './pages/Profile/ProfilePage';
import ChatBot from './components/ChatBot/ChatBot'; 

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/landing"
          element={
            isAuthenticated ? <Navigate to="/home" replace /> : <Landing />
          }
        />

        {/* Public Routes */}
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/home" replace />
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />
        <Route
          path="/signup"
          element={
            isAuthenticated ? (
              <Navigate to="/home" replace />
            ) : (
              <SignUp onRegister={handleLogin} />
            )
          }
        />

        {/* Protected Routes */}
        <Route
          path="/home"
          element={
            isAuthenticated ? (
              <HomePage onLogout={handleLogout} /> // Original ArtworkList
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/explore"
          element={
            isAuthenticated ? (
              <ExplorePage onLogout={handleLogout} /> // New Explore Page
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/profile"
          element={
            isAuthenticated ? (
              <ProfilePage onLogout={handleLogout} /> // New Profile Page
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/chatbot"
          element={
            isAuthenticated ? (
              <ChatBot onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />


        <Route
          path="/addartwork"
          element={
            isAuthenticated ? (
              <AddArtwork onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/artwork/:id"
          element={
            isAuthenticated ? (
              <ArtworkDetail onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        
        <Route
          path="/"
          element={
            isAuthenticated ? <Navigate to="/home" replace /> : <Navigate to="/landing" replace />
          }
        />

        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;